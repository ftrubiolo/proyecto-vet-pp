import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { sql, and, eq, notInArray } from 'drizzle-orm';
import { db } from './index';
import { veterinarios_matriculados_cordoba, categorias_matriculas } from './schema';

// Helper to chunk arrays
function chunkArray<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

async function main() {
  const jsonPath = path.resolve(__dirname, '../../veterinarios_limpios.json');

  if (!fs.existsSync(jsonPath)) {
    console.error(`\n[ERROR] No se encontró el archivo JSON en: ${jsonPath}`);
    console.error(`Por favor ejecuta primero el script extractor de Python para generar este archivo.\n`);
    process.exit(1);
  }

  console.log(`Leyendo datos estructurados de: ${jsonPath}...`);
  const rawData = fs.readFileSync(jsonPath, 'utf-8');
  const records = JSON.parse(rawData) as Array<{
    nombre_completo: string;
    numero_matricula: string;
    dni: string;
    categoria_id: string;
  }>;

  console.log(`Se cargaron ${records.length} registros para importar.`);

  // 1. Asegurar categorías en la base de datos
  console.log('Verificando categorías de matrículas...');
  const defaultCategories = [
    { id: 'A', categoria: 'Activo A', cobertura: 'Veterinarios en el ejercicio general e independiente de la profesión (clínicas privadas, consultorías y comercio veterinario general).' },
    { id: 'B', categoria: 'Activo B', cobertura: 'Veterinarios con cargos electivos o de relación de dependencia exclusiva en organismos públicos nacionales (Ej. SENASA, universidades nacionales). El pago de su matrícula es optativo.' },
    { id: 'C', categoria: 'Activo C', cobertura: 'Profesionales con matrícula activa pero bajo modalidades restrictivas específicas (roles corporativos internos, tareas puramente administrativas no clínicas o regímenes especiales).' },
  ];

  for (const cat of defaultCategories) {
    await db.insert(categorias_matriculas)
      .values(cat)
      .onConflictDoNothing();
  }
  console.log('Categorías verificadas/creadas.');

  // 2. Insertar/Actualizar veterinarios certificados en lotes (chunks) para evitar límites de payload
  const batches = chunkArray(records, 200);
  console.log(`Importando en ${batches.length} lotes de hasta 200 registros...`);

  let totalImported = 0;
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];

    // Mapear los valores a los tipos correctos de la base de datos
    const valuesToInsert = batch.map(rec => ({
      nombre_completo: rec.nombre_completo,
      numero_matricula: rec.numero_matricula,
      dni: rec.dni,
      categoria_id: rec.categoria_id,
      es_valido: rec.categoria_id !== 'B' && rec.categoria_id !== 'C',
    }));

    await db.insert(veterinarios_matriculados_cordoba)
      .values(valuesToInsert)
      .onConflictDoUpdate({
        target: veterinarios_matriculados_cordoba.numero_matricula,
        set: {
          nombre_completo: sql`EXCLUDED.nombre_completo`,
          dni: sql`EXCLUDED.dni`,
          categoria_id: sql`EXCLUDED.categoria_id`,
          es_valido: sql`EXCLUDED.es_valido`,
          actualizado_el: sql`NOW()`,
        },
        where: sql`
          veterinarios_matriculados_cordoba.nombre_completo IS DISTINCT FROM EXCLUDED.nombre_completo OR
          veterinarios_matriculados_cordoba.dni IS DISTINCT FROM EXCLUDED.dni OR
          veterinarios_matriculados_cordoba.categoria_id IS DISTINCT FROM EXCLUDED.categoria_id OR
          veterinarios_matriculados_cordoba.es_valido IS DISTINCT FROM EXCLUDED.es_valido
        `
      });

    totalImported += valuesToInsert.length;
    process.stdout.write(`Progreso: ${totalImported}/${records.length} importados...\r`);
  }

  // 3. Desactivar veterinarios que ya no figuran en el nuevo PDF cargado
  console.log('\nDesactivando profesionales que ya no figuran en el listado certificado...');
  const activeMatriculas = records.map(r => r.numero_matricula);

  if (activeMatriculas.length > 0) {
    await db.update(veterinarios_matriculados_cordoba)
      .set({ es_valido: false, actualizado_el: sql`NOW()` })
      .where(
        and(
          eq(veterinarios_matriculados_cordoba.es_valido, true),
          notInArray(veterinarios_matriculados_cordoba.numero_matricula, activeMatriculas)
        )
      );
    console.log('Veterinarios fuera de lista desactivados correctamente.');
  }

  console.log(`\n[ÉXITO] Se importaron/actualizaron correctamente ${totalImported} veterinarios certificados.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('\n[ERROR] Falló la importación a la base de datos:', err);
  process.exit(1);
});
