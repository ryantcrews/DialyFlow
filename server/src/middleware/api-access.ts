import { isProductionEnvironment } from '@dialyrounds/shared';
import type { Middleware } from '../env.js';
import { error } from '../utils/response.js';

const PRODUCTION_APP_ORIGIN = 'https://app.dialyrounds.com';

export { isApiHost } from '@dialyrounds/shared';

export function validateApiOrigin(request: Request, production: boolean, pathname: string): boolean {
  if (!production) return true;

  const origin = request.headers.get('Origin');
  if (origin) return origin === PRODUCTION_APP_ORIGIN;

  const method = request.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD') return true;

  // Bootstrap is invoked via curl without an Origin header.
  if (pathname === '/api/bootstrap') return true;

  return false;
}

export function rejectDisallowedApiOrigin(
  request: Request,
  production: boolean,
  pathname: string
): Response | null {
  if (validateApiOrigin(request, production, pathname)) return null;
  return error('Forbidden', 403);
}

export const requirePasswordChanged: Middleware = async (_request, ctx, next) => {
  if (ctx.user?.mustChangePassword) {
    return error('Password change required before accessing clinical data', 403);
  }
  return next();
};

export function useSecureCookies(environment: string): boolean {
  return isProductionEnvironment(environment);
}
