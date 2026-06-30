import dotenv from 'dotenv';
dotenv.config();

export const config = {
  NODE_ENV:      process.env.NODE_ENV      || 'development',
  PORT:          parseInt(process.env.PORT || '3001'),
  DATABASE_URL:  process.env.DATABASE_URL  || '',
  JWT_SECRET:    process.env.JWT_SECRET    || 'change-me-in-production',
  JWT_EXPIRES:   process.env.JWT_EXPIRES   || '8h',
  CORS_ORIGIN:   process.env.CORS_ORIGIN   || 'http://localhost:5173',
} as const;
