import dotenv from 'dotenv';
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

// In production, ensure sensitive credentials are provided
if (isProduction) {
  if (!process.env.DATABASE_URL) {
    throw new Error('❌ [FATAL] DATABASE_URL es obligatorio en entorno de producción.');
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('❌ [FATAL] JWT_SECRET seguro (mínimo 32 caracteres) es obligatorio en producción.');
  }
  if (!process.env.FRONTEND_URL) {
    throw new Error('❌ [FATAL] FRONTEND_URL es obligatorio en entorno de producción para configurar CORS.');
  }
}

export const env = {
  PORT: parseInt(process.env.PORT, 10) || 5000,
  DATABASE_URL: process.env.DATABASE_URL || (isProduction ? '' : 'postgresql://postgres:postgres@localhost:5432/vybe_db'),
  JWT_SECRET: process.env.JWT_SECRET || (isProduction ? '' : 'vybe_dev_jwt_secret_key_2026_modern_social'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  NODE_ENV: process.env.NODE_ENV || 'development',
  ENABLE_MEMORY_FALLBACK: process.env.ENABLE_MEMORY_FALLBACK !== undefined
    ? process.env.ENABLE_MEMORY_FALLBACK === 'true'
    : !isProduction,
};
