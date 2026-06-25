import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { sql } from 'drizzle-orm';
import { db } from './index';
import { catalogo_productos, categorias_productos, productos_categorias } from './schema';

// Helper para procesar arreglos en lotes
function chunkArray<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

async function main() {
  const rootDir = path.resolve(__dirname, '../../');
  const catPath = path.resolve(rootDir, 'data/categorias.json');
  const prodPath = path.resolve(rootDir, 'data/productos.json');
  const relPath = path.resolve(rootDir, 'data/productos_categorias.json');

  // Verificar la existencia de todos los archivos JSON requeridos
  for (const filePath of [catPath, prodPath, relPath]) {
    if (!fs.existsSync(filePath)) {
      console.error(`[ERROR] No se encontró el archivo requerido en: ${filePath}`);
      process.exit(1);
    }
  }

  console.log('⏳ Leyendo archivos JSON...');
  const recordsCat = JSON.parse(fs.readFileSync(catPath, 'utf-8')) as Array<{
    id: number;
    categoria: string;
    descripcion?: string;
  }>;
  const recordsProd = JSON.parse(fs.readFileSync(prodPath, 'utf-8')) as Array<{
    id: number;
    numero_senasa: string;
    nombre_comercial: string;
    nombre_firma: string;
  }>;
  const recordsRel = JSON.parse(fs.readFileSync(relPath, 'utf-8')) as Array<{
    id_producto: number;
    id_enfermedad: number;
  }>;

  console.log(`Cargados de archivos locales:
  - ${recordsCat.length} categorías
  - ${recordsProd.length} productos
  - ${recordsRel.length} relaciones`);

  // --- 1. Importar Categorías ---
  console.log('⏳ Importando categorías...');
  const catValues = recordsCat.map(c => ({
    id_senasa: c.id,
    categoria: c.categoria,
    descripcion: c.descripcion || null
  }));

  // Procesar e insertar categorías en lotes
  const catBatches = chunkArray(catValues, 100);
  for (const batch of catBatches) {
    await db.insert(categorias_productos)
      .values(batch)
      .onConflictDoUpdate({
        target: categorias_productos.id_senasa,
        set: {
          categoria: sql`EXCLUDED.categoria`,
          descripcion: sql`EXCLUDED.descripcion`
        }
      });
  }
  console.log('✅ Categorías importadas.');

  // --- 2. Deduplicar y Mapear Productos ---
  console.log('⏳ Deduplicando productos por número SENASA...');
  const idMap = new Map<number, number>(); // originalId -> resolvedId
  const uniqueProducts = new Map<string, number>(); // numero_senasa -> resolvedId
  const productsToInsert: Array<{ id: number; numero_senasa: string; nombre_comercial: string; nombre_firma: string }> = [];

  for (const prod of recordsProd) {
    const senasa = prod.numero_senasa ? prod.numero_senasa.trim() : '';
    const originalId = prod.id;

    if (!senasa) {
      console.warn(`[ADVERTENCIA] Producto ID ${originalId} no tiene número de SENASA. Saltando...`);
      continue;
    }

    if (uniqueProducts.has(senasa)) {
      const resolvedId = uniqueProducts.get(senasa)!;
      idMap.set(originalId, resolvedId);
    } else {
      uniqueProducts.set(senasa, originalId);
      idMap.set(originalId, originalId);
      productsToInsert.push({
        id: originalId,
        numero_senasa: senasa,
        nombre_comercial: prod.nombre_comercial || 'Sin nombre',
        nombre_firma: prod.nombre_firma || 'Desconocido',
      });
    }
  }

  console.log(`Quedan ${productsToInsert.length} productos únicos de los ${recordsProd.length} registros del JSON.`);

  // --- 3. Importar Productos ---
  console.log('⏳ Importando productos en lotes...');
  const prodBatches = chunkArray(productsToInsert, 200);
  let prodImported = 0;
  for (const batch of prodBatches) {
    await db.insert(catalogo_productos)
      .values(batch)
      .onConflictDoUpdate({
        target: catalogo_productos.numero_senasa,
        set: {
          nombre_comercial: sql`EXCLUDED.nombre_comercial`,
          nombre_firma: sql`EXCLUDED.nombre_firma`
        }
      });
    prodImported += batch.length;
    process.stdout.write(`Progreso productos: ${prodImported}/${productsToInsert.length}...\r`);
  }
  console.log('\n✅ Productos importados/actualizados.');

  // --- 4. Mapear e Importar Relaciones ---
  console.log('⏳ Procesando relaciones productos-categorías...');
  
  // Obtener IDs de categorías válidas en la BD
  const validCategoryIds = new Set(recordsCat.map(c => c.id));
  // Obtener IDs de productos válidos (que realmente insertamos/actualizamos)
  const validProductIds = new Set(productsToInsert.map(p => p.id));

  const uniqueRelations = new Set<string>();
  const relationsToInsert: Array<{ producto_id: number; categoria_id: number }> = [];

  for (const rel of recordsRel) {
    const originalProdId = rel.id_producto;
    const originalCatId = rel.id_enfermedad;

    // Resolver ID de producto según mapeo de deduplicación
    const resolvedProdId = idMap.get(originalProdId);

    if (resolvedProdId === undefined) {
      continue; // No existe el producto en el catálogo procesado
    }

    if (validProductIds.has(resolvedProdId) && validCategoryIds.has(originalCatId)) {
      const relationKey = `${resolvedProdId}-${originalCatId}`;
      if (!uniqueRelations.has(relationKey)) {
        uniqueRelations.add(relationKey);
        relationsToInsert.push({
          producto_id: resolvedProdId,
          categoria_id: originalCatId
        });
      }
    }
  }

  console.log(`Quedan ${relationsToInsert.length} relaciones únicas para insertar de las ${recordsRel.length} del JSON.`);

  // Limpiar relaciones anteriores para evitar duplicados en re-importaciones
  console.log('⏳ Limpiando relaciones antiguas de productos-categorías...');
  await db.delete(productos_categorias);

  console.log('⏳ Importando relaciones en lotes...');
  const relBatches = chunkArray(relationsToInsert, 300);
  let relImported = 0;
  for (const batch of relBatches) {
    await db.insert(productos_categorias)
      .values(batch);
    relImported += batch.length;
    process.stdout.write(`Progreso relaciones: ${relImported}/${relationsToInsert.length}...\r`);
  }
  console.log('\n✅ Relaciones importadas con éxito.');

  // --- 5. Resetear las secuencias de serial de las tablas ---
  console.log('⏳ Reseteando secuencias de auto-incremento (serial)...');
  await db.execute(sql`SELECT setval(pg_get_serial_sequence('catalogo_productos', 'id'), COALESCE(MAX(id), 1)) FROM catalogo_productos;`);
  await db.execute(sql`SELECT setval(pg_get_serial_sequence('categorias_productos', 'id'), COALESCE(MAX(id), 1)) FROM categorias_productos;`);
  console.log('✅ Secuencias actualizadas correctamente.');

  console.log('🎉 ¡Carga de productos completada con éxito!');
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ Error durante la importación de productos:', err);
  process.exit(1);
});
