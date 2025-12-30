import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/dialyflow',
  jwtSecret: process.env.JWT_SECRET || 'default-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  twoFactorIssuer: process.env.TWO_FACTOR_ISSUER || 'DialyFlow',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@dialyflow.com',
  adminPassword: process.env.ADMIN_PASSWORD || 'Admin123!@#',
  adminFirstName: process.env.ADMIN_FIRST_NAME || 'Admin',
  adminLastName: process.env.ADMIN_LAST_NAME || 'User',
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  sessionTimeoutMinutes: parseInt(process.env.SESSION_TIMEOUT_MINUTES || '60'),
};
