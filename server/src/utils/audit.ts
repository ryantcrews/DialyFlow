import type { Env } from '../env.js';

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
