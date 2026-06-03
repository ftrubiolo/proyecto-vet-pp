import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is missing');
}

// Configure SSL if specified in connection string
const client = postgres(connectionString, {
  ssl: connectionString.includes('sslmode=require') ? 'require' : undefined,
});

export const db = drizzle(client, { schema });
export type DbClient = typeof db;
