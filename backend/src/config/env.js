import dotenv from 'dotenv';
dotenv.config();

export const env = {
  PORT: process.env.PORT || 5000,
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/vybe_db',
  JWT_SECRET: process.env.JWT_SECRET || 'vybe_super_secure_jwt_secret_key_2026_modern_social',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  NODE_ENV: process.env.NODE_ENV || 'development',
  ENABLE_MEMORY_FALLBACK: process.env.ENABLE_MEMORY_FALLBACK === 'true' || true,
};
