import {
  USER_ROLES,
  validateChangePassword,
  validateCreateUser,
  validateLogin,
} from '@dialyrounds/shared';
import type { UserRole } from '@dialyrounds/shared';
import type { RouteHandler } from '../env.js';
import {
  createSession,
  recordFailedLogin,
  resetFailedLogin,
  revokeSession,
} from '../middleware/auth.js';
import { writeAudit } from '../utils/audit.js';
import {
  generateSalt,
  hashPassword,
  verifyPassword,
} from '../utils/crypto.js';
import {
  clearSessionCookie,
  error,
  getSessionToken,
  json,
  parseJson,
  setSessionCookie,
} from '../utils/response.js';
import { isExpired, sessionExpiry } from '../utils/time.js';

interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  salt: string;
  role: UserRole;
  name: string;
  active: number;
  must_change_password: number;
  locked_until: string | null;
}

export const login: RouteHandler = async (request, ctx) => {
  const body = await parseJson(request);
  const parsed = validateLogin(body);
  if (!parsed.ok) return error('Validation failed', 400, parsed.errors);

  const row = await ctx.env.DB.prepare(
    `SELECT id, email, password_hash, salt, role, name, active, must_change_password, locked_until
     FROM users WHERE lower(email) = ?`
  )
    .bind(parsed.value.email)
    .first<UserRow>();

  if (!row || !row.active) {
    return error('Invalid email or password', 401);
  }
  if (row.locked_until && !isExpired(row.locked_until)) {
    return error('Account temporarily locked. Try again later.', 429);
  }

  const valid = await verifyPassword(parsed.value.password, row.salt, row.password_hash);
  if (!valid) {
    await recordFailedLogin(ctx.env, row.id);
    await writeAudit(ctx.env, row.id, 'login_failed', 'user', row.id);
    return error('Invalid email or password', 401);
  }

  await resetFailedLogin(ctx.env, row.id);
  const { expiresAt, maxAgeSeconds } = sessionExpiry();
  const token = await createSession(ctx.env, row.id, expiresAt);
  await writeAudit(ctx.env, row.id, 'login', 'user', row.id);

  const secureCookies = ctx.env.ENVIRONMENT === 'production';
  return json(
    {
      user: {
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role,
        mustChangePassword: row.must_change_password === 1,
      },
    },
    200,
    { 'Set-Cookie': setSessionCookie(token, maxAgeSeconds, secureCookies) }
  );
};

export const logout: RouteHandler = async (request, ctx) => {
  const token = getSessionToken(request);
  if (token) {
    await revokeSession(ctx.env, token);
    if (ctx.user) {
      await writeAudit(ctx.env, ctx.user.id, 'logout', 'user', ctx.user.id);
    }
  }
  return json({ ok: true }, 200, {
    'Set-Cookie': clearSessionCookie(ctx.env.ENVIRONMENT === 'production'),
  });
};

export const me: RouteHandler = async (_request, ctx) => {
  if (!ctx.user) return error('Unauthorized', 401);
  return json({ user: ctx.user });
};

export const changePassword: RouteHandler = async (request, ctx) => {
  if (!ctx.user) return error('Unauthorized', 401);
  const body = await parseJson(request);
  const parsed = validateChangePassword(body);
  if (!parsed.ok) return error('Validation failed', 400, parsed.errors);

  const row = await ctx.env.DB.prepare(
    'SELECT password_hash, salt FROM users WHERE id = ?'
  )
    .bind(ctx.user.id)
    .first<{ password_hash: string; salt: string }>();

  if (!row) return error('User not found', 404);

  const valid = await verifyPassword(
    parsed.value.currentPassword,
    row.salt,
    row.password_hash
  );
  if (!valid) return error('Current password is incorrect', 400);

  const salt = await generateSalt();
  const passwordHash = await hashPassword(parsed.value.newPassword, salt);
  await ctx.env.DB.prepare(
    `UPDATE users SET password_hash = ?, salt = ?, must_change_password = 0 WHERE id = ?`
  )
    .bind(passwordHash, salt, ctx.user.id)
    .run();

  await writeAudit(ctx.env, ctx.user.id, 'password_change', 'user', ctx.user.id);
  return json({ ok: true });
};

export const listUsers: RouteHandler = async (_request, ctx) => {
  const { results } = await ctx.env.DB.prepare(
    `SELECT id, email, name, role, active, must_change_password, created_at
     FROM users ORDER BY name`
  ).all<{
    id: number;
    email: string;
    name: string;
    role: UserRole;
    active: number;
    must_change_password: number;
    created_at: string;
  }>();

  return json({
    users: (results ?? []).map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      active: u.active === 1,
      mustChangePassword: u.must_change_password === 1,
      createdAt: u.created_at,
    })),
  });
};

export const createUser: RouteHandler = async (request, ctx) => {
  const body = await parseJson(request);
  const parsed = validateCreateUser(body);
  if (!parsed.ok) return error('Validation failed', 400, parsed.errors);

  const salt = await generateSalt();
  const passwordHash = await hashPassword(parsed.value.password, salt);

  try {
    const result = await ctx.env.DB.prepare(
      `INSERT INTO users (email, password_hash, salt, role, name, must_change_password)
       VALUES (?, ?, ?, ?, ?, 1)`
    )
      .bind(parsed.value.email, passwordHash, salt, parsed.value.role, parsed.value.name)
      .run();

    await writeAudit(ctx.env, ctx.user!.id, 'create_user', 'user', result.meta.last_row_id);
    return json({ id: result.meta.last_row_id }, 201);
  } catch {
    return error('Email already exists', 409);
  }
};

export const updateUser: RouteHandler = async (request, ctx) => {
  const id = Number(ctx.params.id);
  if (!Number.isInteger(id)) return error('Invalid user id', 400);

  const body = (await parseJson<Record<string, unknown>>(request)) ?? {};
  const updates: string[] = [];
  const values: unknown[] = [];

  if (typeof body.name === 'string' && body.name.trim()) {
    updates.push('name = ?');
    values.push(body.name.trim());
  }
  if (typeof body.role === 'string' && (USER_ROLES as readonly string[]).includes(body.role)) {
    updates.push('role = ?');
    values.push(body.role);
  }
  if (typeof body.active === 'boolean') {
    updates.push('active = ?');
    values.push(body.active ? 1 : 0);
  }

  if (!updates.length) return error('No fields to update', 400);

  values.push(id);
  await ctx.env.DB.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();

  await writeAudit(ctx.env, ctx.user!.id, 'update_user', 'user', id);
  return json({ ok: true });
};

export const resetUserPassword: RouteHandler = async (request, ctx) => {
  const id = Number(ctx.params.id);
  if (!Number.isInteger(id)) return error('Invalid user id', 400);

  const body = (await parseJson<{ password?: string }>(request)) ?? {};
  const password = typeof body.password === 'string' ? body.password : '';
  if (password.length < 8) return error('Password must be at least 8 characters', 400);

  const salt = await generateSalt();
  const passwordHash = await hashPassword(password, salt);
  await ctx.env.DB.prepare(
    `UPDATE users SET password_hash = ?, salt = ?, must_change_password = 1 WHERE id = ?`
  )
    .bind(passwordHash, salt, id)
    .run();

  await writeAudit(ctx.env, ctx.user!.id, 'reset_password', 'user', id);
  return json({ ok: true });
};

export async function ensureAdminUser(db: D1Database): Promise<void> {
  const existing = await db.prepare('SELECT id FROM users LIMIT 1').first();
  if (existing) return;

  const salt = await generateSalt();
  const passwordHash = await hashPassword('ChangeMe123!', salt);
  await db.prepare(
    `INSERT INTO users (email, password_hash, salt, role, name, must_change_password)
     VALUES (?, ?, ?, 'admin', 'Admin', 1)`
  )
    .bind('admin@dialyrounds.local', passwordHash, salt)
    .run();

  const units = await db.prepare('SELECT COUNT(*) as count FROM units').first<{ count: number }>();
  if ((units?.count ?? 0) === 0) {
    const names = [
      'West Iredell WFB',
      'Wilkesboro WFB',
      'Davie WFB',
      'Statesville WFB',
      'Lake Norman WFB',
      'Taylorsville FMC',
    ];
    for (const name of names) {
      await db.prepare('INSERT INTO units (name) VALUES (?)').bind(name).run();
    }
  }
}
