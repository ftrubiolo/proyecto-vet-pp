#!/bin/sh
set -e

echo "=== [VetVault API] Inicializando servicio backend ==="

# Compilar paquete compartido
echo "-> Compilando @vetvault/shared..."
cd /app/packages/shared
npm run build

# Sincronizar esquema de base de datos
echo "-> Sincronizando esquema PostgreSQL con Drizzle ORM..."
cd /app/services/api-backend
npx drizzle-kit push

# Inicializar bucket en MinIO S3
echo "-> Verificando bucket de almacenamiento en MinIO S3..."
npm run bucket:init || echo "Aviso: Bucket init omitido o diferido."

# Verificar si se requiere poblar las tablas maestras iniciales
echo "-> Verificando tablas maestras..."
node -e "
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);
async function check() {
  try {
    const res = await sql\`SELECT count(*)::int as count FROM roles\`;
    if (res[0].count === 0) process.exit(10);
    process.exit(0);
  } catch(e) {
    process.exit(10);
  }
}
check();
" && echo "✅ Tablas maestras ya pobladas." || {
  echo "🌱 Inicializando tablas maestras y catálogos de SENASA / Colegio de Veterinarios..."
  npm run db:seed
  npm run db:import-vets || true
  npm run db:import-productos || true
  echo "✅ Catálogos y datos iniciales cargados."
}

echo "=== [VetVault API] Servidor listo. Iniciando Fastify en puerto ${PORT:-8000} ==="
exec npm run dev
