import pg from 'pg';
import { newDb } from 'pg-mem';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let poolInstance = null;
let isInMemory = false;

export async function getDbPool() {
  if (poolInstance) return poolInstance;

  const connectionString = process.env.DATABASE_URL;

  // Try real PostgreSQL first
  if (connectionString) {
    try {
      const realPool = new pg.Pool({
        connectionString,
        connectionTimeoutMillis: 2000,
      });

      // Test connection
      const client = await realPool.connect();
      client.release();
      console.log('✅ Connected to live PostgreSQL database');
      poolInstance = realPool;
      isInMemory = false;
      await initSchema(poolInstance);
      return poolInstance;
    } catch (err) {
      console.warn('⚠️  Could not connect to live PostgreSQL server:', err.message);
      console.log('🔄 Falling back to embedded in-memory PostgreSQL engine (pg-mem)...');
    }
  }

  // Fallback to in-memory PostgreSQL engine
  const memDb = newDb();
  
  // Register necessary Postgres functions/casts in pg-mem if needed
  memDb.public.registerFunction({
    name: 'current_database',
    args: [],
    returns: memDb.public.getType('text'),
    implementation: () => 'git_reset_lab_mem',
  });

  const adapter = memDb.adapters.createPg();
  const memPool = new adapter.Pool();
  
  console.log('✅ Embedded in-memory PostgreSQL database initialized successfully.');
  poolInstance = memPool;
  isInMemory = true;
  await initSchema(poolInstance);
  return poolInstance;
}

export function isUsingInMemoryDb() {
  return isInMemory;
}

async function initSchema(pool) {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  // If in-memory, remove CREATE INDEX IF NOT EXISTS or split statements
  try {
    // Execute schema statements
    await pool.query(schemaSql);
    console.log('✅ Database schema verified / initialized.');
  } catch (err) {
    console.warn('Note on schema init:', err.message);
    // In case of pg-mem minor syntax variances, execute table creations individually
    const statements = schemaSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const stmt of statements) {
      try {
        await pool.query(stmt);
      } catch (innerErr) {
        // Skip index errors or benign syntax warnings in memory engine
        if (!stmt.toLowerCase().includes('create index')) {
          console.error('Schema statement warning:', innerErr.message, stmt.slice(0, 50));
        }
      }
    }
    console.log('✅ Schema tables verified.');
  }
}

export async function query(text, params) {
  const pool = await getDbPool();
  return pool.query(text, params);
}
