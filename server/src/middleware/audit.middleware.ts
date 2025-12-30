import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { AuditLog } from '../models/AuditLog.model';

export const auditMiddleware = (action: string, resource: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const originalSend = res.send;

    res.send = function (data: any) {
      res.send = originalSend;

      // Only log successful operations (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        setImmediate(() => {
          AuditLog.create({
            user: req.user!._id,
            action,
            resource,
            resourceId: req.params.id || undefined,
            details: {
              method: req.method,
              path: req.path,
              body: sanitizeBody(req.body),
            },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
          }).catch((error) => {
            // Log error but don't fail the request
            console.error('Audit log error:', error);
          });
        });
      }

      return originalSend.call(this, data);
    };

    next();
  };
};

// Remove sensitive fields from audit logs
function sanitizeBody(body: any): any {
  if (!body || typeof body !== 'object') return body;
  
  const sanitized = { ...body };
  const sensitiveFields = ['password', 'twoFactorSecret', 'token'];
  
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
}
