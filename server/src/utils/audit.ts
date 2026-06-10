import type { Env } from '../env.js';

export function auditKv(parts: Record<string, string | number | boolean | null | undefined>): string {
  return Object.entries(parts)
    .filter(([, value]) => value != null && value !== '')
    .map(([key, value]) => `${key}=${value}`)
    .join(';');
}

export async function patientAuditLabel(db: D1Database, patientId: number): Promise<string> {
  const row = await db
    .prepare('SELECT last_name, first_name FROM patients WHERE id = ?')
    .bind(patientId)
    .first<{ last_name: string; first_name: string }>();
  return row ? `${row.last_name}, ${row.first_name}` : `patient#${patientId}`;
}

export async function writeAudit(
  env: Env,
  userId: number | null,
  action: string,
  entityType: string,
  entityId: string | number | null,
  details = ''
): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO audit_log (user_id, action, entity_type, entity_id, details)
     VALUES (?, ?, ?, ?, ?)`
  )
    .bind(userId, action, entityType, entityId != null ? String(entityId) : null, details)
    .run();
}
