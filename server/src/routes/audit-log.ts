import type { AuditLogEntry } from '@dialyrounds/shared';
import type { RouteHandler } from '../env.js';
import { json } from '../utils/response.js';

const NOISE_ACTIONS = [
  'list_patients',
  'view_patient',
  'get_attest_day',
  'get_attest_session',
  'list_attest_queue',
  'list_attest',
];

interface AuditRow {
  id: number;
  user_id: number | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: string;
  created_at: string;
  user_name: string | null;
  user_email: string | null;
}

export const listAuditLog: RouteHandler = async (_request, ctx) => {
  const showAll = ctx.url.searchParams.get('all') === '1';
  const limitRaw = Number(ctx.url.searchParams.get('limit') ?? '150');
  const limit = Number.isInteger(limitRaw) ? Math.min(Math.max(limitRaw, 1), 500) : 150;

  let query = `SELECT a.id, a.user_id, a.action, a.entity_type, a.entity_id, a.details, a.created_at,
                      u.name as user_name, u.email as user_email
               FROM audit_log a
               LEFT JOIN users u ON u.id = a.user_id`;

  const binds: unknown[] = [];
  if (!showAll) {
    const placeholders = NOISE_ACTIONS.map(() => '?').join(', ');
    query += ` WHERE a.action NOT IN (${placeholders})`;
    binds.push(...NOISE_ACTIONS);
  }

  query += ' ORDER BY a.created_at DESC, a.id DESC LIMIT ?';
  binds.push(limit);

  const { results } = await ctx.env.DB.prepare(query).bind(...binds).all<AuditRow>();

  const entries: AuditLogEntry[] = (results ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    userEmail: row.user_email,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    details: row.details,
    createdAt: row.created_at,
  }));

  return json({ entries });
};
