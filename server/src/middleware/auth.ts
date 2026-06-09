import { LOGIN_LOCKOUT_MS, LOGIN_MAX_ATTEMPTS } from '@dialyrounds/shared';
import type { AuthUser, Middleware, RequestContext } from '../env.js';
import { hashToken } from '../utils/crypto.js';
import { clearSessionCookie, error, getSessionToken } from '../utils/response.js';
import { isExpired, isIdleExpired, nowIso } from '../utils/time.js';

interface SessionRow {
  token_hash: string;
  user_id: number;
  expires_at: string;
  last_seen_at: string;
  email: string;
  name: string;
  role: 'admin' | 'clinician';
  must_change_password: number;
  active: number;
}

async function loadSession(env: RequestContext['env'], token: string): Promise<AuthUser | null> {
  const tokenHash = await hashToken(token);
  const row = await env.DB.prepare(
    `SELECT s.token_hash, s.user_id, s.expires_at, s.last_seen_at,
            u.email, u.name, u.role, u.must_change_password, u.active
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ?`
  )
    .bind(tokenHash)
    .first<SessionRow>();

  if (!row || !row.active) return null;
  if (isExpired(row.expires_at) || isIdleExpired(row.last_seen_at)) {
    await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(tokenHash).run();
    return null;
  }

  await env.DB.prepare('UPDATE sessions SET last_seen_at = ? WHERE token_hash = ?')
    .bind(nowIso(), tokenHash)
    .run();

  return {
    id: row.user_id,
    email: row.email,
    name: row.name,
    role: row.role,
    mustChangePassword: row.must_change_password === 1,
  };
}

export const requireAuth: Middleware = async (request, ctx, next) => {
  const token = getSessionToken(request);
  if (!token) {
    return error('Unauthorized', 401);
  }
  const user = await loadSession(ctx.env, token);
  if (!user) {
    return error('Unauthorized', 401, undefined);
  }
  ctx.user = user;
  return next();
};

export const requireAdmin: Middleware = async (_request, ctx, next) => {
  if (!ctx.user || ctx.user.role !== 'admin') {
    return error('Forbidden', 403);
  }
  return next();
};

export async function revokeSession(env: RequestContext['env'], token: string): Promise<void> {
  const tokenHash = await hashToken(token);
  await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(tokenHash).run();
}

export async function createSession(
  env: RequestContext['env'],
  userId: number,
  expiresAt: string
): Promise<string> {
  const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
  const tokenHash = await hashToken(token);
  const now = nowIso();
  await env.DB.prepare(
    `INSERT INTO sessions (token_hash, user_id, expires_at, last_seen_at)
     VALUES (?, ?, ?, ?)`
  )
    .bind(tokenHash, userId, expiresAt, now)
    .run();
  return token;
}

export async function recordFailedLogin(env: RequestContext['env'], userId: number): Promise<void> {
  const row = await env.DB.prepare(
    'SELECT failed_login_count FROM users WHERE id = ?'
  )
    .bind(userId)
    .first<{ failed_login_count: number }>();

  const count = (row?.failed_login_count ?? 0) + 1;
  if (count >= LOGIN_MAX_ATTEMPTS) {
    const lockedUntil = new Date(Date.now() + LOGIN_LOCKOUT_MS).toISOString();
    await env.DB.prepare(
      'UPDATE users SET failed_login_count = ?, locked_until = ? WHERE id = ?'
    )
      .bind(count, lockedUntil, userId)
      .run();
  } else {
    await env.DB.prepare('UPDATE users SET failed_login_count = ? WHERE id = ?')
      .bind(count, userId)
      .run();
  }
}

export async function resetFailedLogin(env: RequestContext['env'], userId: number): Promise<void> {
  await env.DB.prepare(
    'UPDATE users SET failed_login_count = 0, locked_until = NULL WHERE id = ?'
  )
    .bind(userId)
    .run();
}
