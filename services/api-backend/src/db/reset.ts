import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Error: DATABASE_URL environment variable is missing');
  process.exit(1);
}

const client = postgres(connectionString, {
  ssl: connectionString.includes('sslmode=require') ? 'require' : undefined,
});

async function main() {
  console.log('Resetting database: dropping and recreating the public schema...');
  
  // Drop and recreate the public schema to wipe all tables, views, types, etc.
  await client`DROP SCHEMA public CASCADE;`;
  await client`CREATE SCHEMA public;`;

  console.log('Database successfully reset!');
  await client.end();
}

main().catch((err) => {
  console.error('Failed to reset database:', err);
  process.exit(1);
});
