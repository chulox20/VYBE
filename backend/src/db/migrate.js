import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, checkPgConnection } from './pool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  console.log('🚀 Iniciando migración de base de datos PostgreSQL...');
  try {
    const isConnected = await checkPgConnection();
    if (!isConnected) {
      console.log('ℹ️  PostgreSQL no disponible. Migración omitida (modo desarrollo fallback activo).');
      process.exit(0);
    }

    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('⏳ Ejecutando schema.sql...');
    await pool.query(sql);
    console.log('✅ Esquema y tablas de PostgreSQL creados correctamente.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error ejecutando migración:', error);
    process.exit(1);
  }
}

runMigration();
