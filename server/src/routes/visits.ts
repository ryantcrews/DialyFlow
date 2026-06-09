import {
  currentMonthInClinic,
  monthDateRange,
  validateCreateVisit,
  validateMonthParam,
  validateUpdateVisit,
  MONTHLY_NOTE_TARGET,
  WEEKLY_NOTE_TARGET,
} from '@dialyrounds/shared';
import type { NoteType, Visit } from '@dialyrounds/shared';
import type { RouteHandler } from '../env.js';
import { writeAudit } from '../utils/audit.js';
import { error, json, parseJson } from '../utils/response.js';
import { nowIso } from '../utils/time.js';

const COMPREHENSIVE_EXISTS_ERROR =
  'A comprehensive note for this month was already submitted. Another can be added on the 1st of next month.';

async function comprehensiveExistsForMonth(
  db: D1Database,
  patientId: number,
  visitDate: string,
  excludeVisitId?: number
): Promise<boolean> {
  const month = visitDate.slice(0, 7);
  const { start, end } = monthDateRange(month);
  const query =
    excludeVisitId != null
      ? `SELECT id FROM visits
         WHERE patient_id = ? AND note_type = 'comprehensive'
           AND visit_date >= ? AND visit_date <= ? AND id != ?
         LIMIT 1`
      : `SELECT id FROM visits
         WHERE patient_id = ? AND note_type = 'comprehensive'
           AND visit_date >= ? AND visit_date <= ?
         LIMIT 1`;
  const stmt =
    excludeVisitId != null
      ? db.prepare(query).bind(patientId, start, end, excludeVisitId)
      : db.prepare(query).bind(patientId, start, end);
  const row = await stmt.first<{ id: number }>();
  return Boolean(row);
}

interface VisitRow {
  id: number;
  patient_id: number;
  user_id: number;
  visit_date: string;
  note_type: NoteType;
  seen_on_hd: number;
  monthly_note: number;
  cipa: number;
  notes: string;
  assessment: string;
  visit_logged: number;
  created_at: string;
  updated_at: string;
}

function mapVisit(row: VisitRow): Visit {
  return {
    id: row.id,
    patientId: row.patient_id,
    userId: row.user_id,
    visitDate: row.visit_date,
    noteType: row.note_type,
    seenOnHd: row.seen_on_hd === 1,
    monthlyNote: row.monthly_note === 1,
    cipa: row.cipa === 1,
    notes: row.notes,
    assessment: row.assessment,
    visitLogged: row.visit_logged === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const listVisits: RouteHandler = async (_request, ctx) => {
  const patientId = Number(ctx.params.id);
  if (!Number.isInteger(patientId)) return error('Invalid patient id', 400);

  const monthParam = ctx.url.searchParams.get('month');
  const month = monthParam ?? currentMonthInClinic();
  const monthCheck = validateMonthParam(month);
  if (!monthCheck.ok) return error('Validation failed', 400, monthCheck.errors);

  const { start, end } = monthDateRange(monthCheck.value);
  const { results } = await ctx.env.DB.prepare(
    `SELECT id, patient_id, user_id, visit_date, note_type, seen_on_hd, monthly_note, cipa, notes, assessment, visit_logged, created_at, updated_at
     FROM visits WHERE patient_id = ? AND visit_date >= ? AND visit_date <= ?
     ORDER BY created_at DESC, id DESC`
  )
    .bind(patientId, start, end)
    .all<VisitRow>();

  return json({ visits: (results ?? []).map(mapVisit) });
};

export const createVisit: RouteHandler = async (request, ctx) => {
  const body = await parseJson(request);
  const parsed = validateCreateVisit(body);
  if (!parsed.ok) return error('Validation failed', 400, parsed.errors);

  if (parsed.value.noteType === 'comprehensive') {
    const exists = await comprehensiveExistsForMonth(
      ctx.env.DB,
      parsed.value.patientId,
      parsed.value.visitDate
    );
    if (exists) return error(COMPREHENSIVE_EXISTS_ERROR, 409);
  }

  const monthlyNote = parsed.value.noteType === 'comprehensive' ? 1 : 0;

  const result = await ctx.env.DB.prepare(
    `INSERT INTO visits (patient_id, user_id, visit_date, note_type, seen_on_hd, monthly_note, cipa, notes, assessment, visit_logged)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`
  )
    .bind(
      parsed.value.patientId,
      ctx.user!.id,
      parsed.value.visitDate,
      parsed.value.noteType,
      parsed.value.seenOnHd ? 1 : 0,
      monthlyNote,
      parsed.value.cipa ? 1 : 0,
      parsed.value.notes ?? '',
      parsed.value.assessment ?? ''
    )
    .run();

  await writeAudit(ctx.env, ctx.user!.id, 'create_visit', 'visit', result.meta.last_row_id);
  return json({ id: result.meta.last_row_id }, 201);
};

export const updateVisit: RouteHandler = async (request, ctx) => {
  const id = Number(ctx.params.id);
  if (!Number.isInteger(id)) return error('Invalid visit id', 400);

  const existing = await ctx.env.DB.prepare(
    'SELECT patient_id, visit_date, note_type FROM visits WHERE id = ?'
  )
    .bind(id)
    .first<{ patient_id: number; visit_date: string; note_type: NoteType }>();

  if (!existing) return error('Visit not found', 404);

  const body = await parseJson(request);
  const parsed = validateUpdateVisit(body);
  if (!parsed.ok) return error('Validation failed', 400, parsed.errors);

  if (
    parsed.value.noteType === 'comprehensive' &&
    existing.note_type !== 'comprehensive'
  ) {
    const exists = await comprehensiveExistsForMonth(
      ctx.env.DB,
      existing.patient_id,
      existing.visit_date,
      id
    );
    if (exists) return error(COMPREHENSIVE_EXISTS_ERROR, 409);
  }

  const updates: string[] = ['updated_at = ?', 'visit_logged = 1'];
  const values: unknown[] = [nowIso()];

  if (parsed.value.noteType !== undefined) {
    updates.push('note_type = ?');
    values.push(parsed.value.noteType);
    updates.push('monthly_note = ?');
    values.push(parsed.value.noteType === 'comprehensive' ? 1 : 0);
  }
  if (parsed.value.seenOnHd !== undefined) {
    updates.push('seen_on_hd = ?');
    values.push(parsed.value.seenOnHd ? 1 : 0);
  }
  if (parsed.value.monthlyNote !== undefined) {
    updates.push('monthly_note = ?');
    values.push(parsed.value.monthlyNote ? 1 : 0);
  }
  if (parsed.value.cipa !== undefined) {
    updates.push('cipa = ?');
    values.push(parsed.value.cipa ? 1 : 0);
  }
  if (parsed.value.notes !== undefined) {
    updates.push('notes = ?');
    values.push(parsed.value.notes);
  }
  if (parsed.value.assessment !== undefined) {
    updates.push('assessment = ?');
    values.push(parsed.value.assessment);
  }

  values.push(id);
  await ctx.env.DB.prepare(`UPDATE visits SET ${updates.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();

  await writeAudit(ctx.env, ctx.user!.id, 'update_visit', 'visit', id);
  return json({ ok: true });
};
