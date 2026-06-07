import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { sql } from 'drizzle-orm';
import { db } from './index';

async function main() {
  try {
    console.log('⏳ Iniciando la carga de tablas maestras...');
    
    // Ruta al archivo SQL en el mismo directorio src/db/
    const sqlPath = path.resolve(__dirname, 'tablasMaestras.sql');
    
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`No se encontró el archivo SQL en: ${sqlPath}`);
    }

    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Ejecutamos el SQL crudo
    await db.execute(sql.raw(sqlContent));

    console.log('✅ ¡Tablas maestras cargadas con éxito!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error cargando las tablas maestras:', error);
    process.exit(1);
  }
}

main();
