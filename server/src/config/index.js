import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  env: process.env.NODE_ENV || 'development',
  
  // Database Connection URL (PostgreSQL / SQLite)
  dbUrl: process.env.DATABASE_URL || 'file:./src/db/data',

  // JWT Token Secrets
  jwtSecret: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'spendpilot_super_secure_jwt_access_secret_2026',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'spendpilot_super_secure_jwt_refresh_secret_2026',
  
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  jwtRememberExpiresIn: process.env.JWT_REMEMBER_EXPIRES_IN || '30d',
  
  // Rate Limiting Constants
  rateLimit: {
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10, // 10 attempts per window
      message: 'Too many login/register attempts. Please try again after 15 minutes.'
    },
    api: {
      windowMs: 15 * 60 * 1000,
      max: 300,
      message: 'Rate limit exceeded. Please slow down.'
    }
  },

  // Storage
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxFileSize: 2 * 1024 * 1024, // 2MB
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],

  // API Keys (Strict Server-Side Isolation)
  resendApiKey: process.env.RESEND_API_KEY || process.env.EMAIL_API_KEY || '',
  exchangeApiKey: process.env.EXCHANGE_API_KEY || '',
  geminiApiKey: process.env.GEMINI_API_KEY || ''
};
