import pkg from 'pg';
const { Pool } = pkg;
import { env } from '../config/env.js';
import { memoryStore } from './memoryStore.js';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 3000,
});

// Crucial: Handle background pool errors to prevent Node from crashing when PG is offline
pool.on('error', (err) => {
  // Ignored in dev fallback mode
});

let isPgConnected = null;

export async function checkPgConnection() {
  if (isPgConnected !== null) return isPgConnected;
  try {
    const client = await pool.connect();
    client.release();
    isPgConnected = true;
    console.log('✅ [PostgreSQL] Conexión establecida con éxito en:', env.DATABASE_URL);
    return true;
  } catch (err) {
    isPgConnected = false;
    if (env.ENABLE_MEMORY_FALLBACK) {
      console.warn(`\n⚠️  [PostgreSQL] Base de datos no disponible (${err.message}).`);
      console.log('⚡ [VYBE Engine] Activando motor in-memory para desarrollo local autónomo.');
      await memoryStore.init();
      return false;
    } else {
      console.error(`\n❌ Error de conexión a PostgreSQL: ${err.message}`);
      const dbErr = new Error('Base de datos PostgreSQL no disponible');
      dbErr.statusCode = 503;
      throw dbErr;
    }
  }
}

export async function query(text, params = []) {
  const pgAlive = await checkPgConnection();
  if (pgAlive) {
    return await pool.query(text, params);
  }
  if (env.ENABLE_MEMORY_FALLBACK) {
    return { rows: [] };
  }
  const dbErr = new Error('Base de datos PostgreSQL no disponible');
  dbErr.statusCode = 503;
  throw dbErr;
}

export async function withTransaction(callback) {
  const pgAlive = await checkPgConnection();
  if (pgAlive) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  return await callback({ query });
}
