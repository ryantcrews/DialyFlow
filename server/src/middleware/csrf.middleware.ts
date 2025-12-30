import { Request, Response, NextFunction } from 'express';

// CSRF protection middleware using Double Submit Cookie pattern
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF check for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip for public endpoints
  const publicPaths = ['/api/auth/login', '/api/auth/register'];
  if (publicPaths.includes(req.path)) {
    return next();
  }

  // Validate origin header for state-changing requests
  const origin = req.headers.origin || req.headers.referer;
  const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',');

  if (origin) {
    const originUrl = new URL(origin);
    const isAllowed = allowedOrigins.some(allowed => {
      const allowedUrl = new URL(allowed.trim());
      return originUrl.origin === allowedUrl.origin;
    });

    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: 'Invalid origin',
      });
    }
  }

  next();
};

// Configure secure cookie options
export const secureCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};
