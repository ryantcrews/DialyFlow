import {
  currentMonthInClinic,
  monthDateRange,
  validateAssignment,
  validateCreatePatient,
  validateMonthParam,
  validateStatus,
  validateUpdatePatient,
  MONTHLY_NOTE_TARGET,
  WEEKLY_NOTE_TARGET,
} from '@dialyrounds/shared';
import type { Patient, PatientStatus, Shift } from '@dialyrounds/shared';
import type { RouteHandler } from '../env.js';
import { writeAudit } from '../utils/audit.js';
import { error, json, parseJson } from '../utils/response.js';

interface PatientRow {
  id: number;
  first_name: string;
  last_name: string;
  dob: string;
  sticky_note: string;
  unit_id: number;
  shift: Shift;
  status: PatientStatus;
  active: number;
  created_at: string;
}

function mapPatient(row: PatientRow): Patient {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    dob: row.dob,
    stickyNote: row.sticky_note,
    unitId: row.unit_id,
    shift: row.shift,
    status: row.status,
    active: row.active === 1,
    createdAt: row.created_at,
  };
}

export const listPatients: RouteHandler = async (_request, ctx) => {
  const unitId = ctx.url.searchParams.get('unit');
  const shift = ctx.url.searchParams.get('shift');
  const status = ctx.url.searchParams.get('status') ?? 'active';
  const month = ctx.url.searchParams.get('month') ?? currentMonthInClinic();
  const monthCheck = validateMonthParam(month);
  if (!monthCheck.ok) return error('Validation failed', 400, monthCheck.errors);

  if (!unitId || !shift) return error('unit and shift query params are required', 400);

  const { start, end } = monthDateRange(monthCheck.value);

  let query = `SELECT p.id, p.first_name, p.last_name, p.dob, p.sticky_note, p.unit_id, p.shift, p.status, p.active, p.created_at,
                      COALESCE(v.comprehensive_count, 0) as comprehensive_count,
                      COALESCE(v.basic_count, 0) as basic_count
               FROM patients p
               LEFT JOIN (
                 SELECT patient_id,
                        SUM(CASE WHEN note_type = 'comprehensive' THEN 1 ELSE 0 END) as comprehensive_count,
                        SUM(CASE WHEN note_type = 'basic' THEN 1 ELSE 0 END) as basic_count
                 FROM visits
                 WHERE visit_date >= ? AND visit_date <= ?
                 GROUP BY patient_id
               ) v ON v.patient_id = p.id
               WHERE p.active = 1 AND p.unit_id = ? AND p.shift = ?`;
  const binds: unknown[] = [start, end, Number(unitId), shift];

  if (status !== 'all') {
    query += ' AND p.status = ?';
    binds.push(status);
  }
  query += ' ORDER BY p.last_name, p.first_name';

  const { results } = await ctx.env.DB.prepare(query).bind(...binds).all<
    PatientRow & { comprehensive_count: number; basic_count: number }
  >();

  await writeAudit(ctx.env, ctx.user!.id, 'list_patients', 'unit', unitId, `shift=${shift}`);
  return json({
    patients: (results ?? []).map((row) => ({
      ...mapPatient(row),
      comprehensiveCount: row.comprehensive_count,
      basicCount: row.basic_count,
      monthlyTarget: MONTHLY_NOTE_TARGET,
      weeklyTarget: WEEKLY_NOTE_TARGET,
    })),
  });
};

export const createPatient: RouteHandler = async (request, ctx) => {
  const body = await parseJson(request);
  const parsed = validateCreatePatient(body);
  if (!parsed.ok) return error('Validation failed', 400, parsed.errors);

  try {
    const result = await ctx.env.DB.prepare(
      `INSERT INTO patients (first_name, last_name, dob, sticky_note, unit_id, shift)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(
        parsed.value.firstName,
        parsed.value.lastName,
        parsed.value.dob,
        parsed.value.stickyNote ?? '',
        parsed.value.unitId,
        parsed.value.shift
      )
      .run();

    const patientId = result.meta.last_row_id as number;
    await ctx.env.DB.prepare(
      `INSERT INTO assignment_history (patient_id, unit_id, shift, changed_by)
       VALUES (?, ?, ?, ?)`
    )
      .bind(patientId, parsed.value.unitId, parsed.value.shift, ctx.user!.id)
      .run();

    await writeAudit(ctx.env, ctx.user!.id, 'create_patient', 'patient', patientId);
    return json({ id: patientId }, 201);
  } catch {
    return error('Patient already exists in this unit', 409);
  }
};

export const updatePatient: RouteHandler = async (request, ctx) => {
  const id = Number(ctx.params.id);
  if (!Number.isInteger(id)) return error('Invalid patient id', 400);

  const body = await parseJson(request);
  const parsed = validateUpdatePatient(body);
  if (!parsed.ok) return error('Validation failed', 400, parsed.errors);

  const updates: string[] = [];
  const values: unknown[] = [];
  if (parsed.value.firstName) {
    updates.push('first_name = ?');
    values.push(parsed.value.firstName);
  }
  if (parsed.value.lastName) {
    updates.push('last_name = ?');
    values.push(parsed.value.lastName);
  }
  if (parsed.value.dob) {
    updates.push('dob = ?');
    values.push(parsed.value.dob);
  }
  if (parsed.value.stickyNote !== undefined) {
    updates.push('sticky_note = ?');
    values.push(parsed.value.stickyNote);
  }

  values.push(id);
  await ctx.env.DB.prepare(`UPDATE patients SET ${updates.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();

  await writeAudit(ctx.env, ctx.user!.id, 'update_patient', 'patient', id);
  return json({ ok: true });
};

export const deletePatient: RouteHandler = async (_request, ctx) => {
  const id = Number(ctx.params.id);
  if (!Number.isInteger(id)) return error('Invalid patient id', 400);

  await ctx.env.DB.prepare('UPDATE patients SET active = 0 WHERE id = ?').bind(id).run();
  await writeAudit(ctx.env, ctx.user!.id, 'delete_patient', 'patient', id);
  return json({ ok: true });
};

export const reassignPatient: RouteHandler = async (request, ctx) => {
  const id = Number(ctx.params.id);
  if (!Number.isInteger(id)) return error('Invalid patient id', 400);

  const body = await parseJson(request);
  const parsed = validateAssignment(body);
  if (!parsed.ok) return error('Validation failed', 400, parsed.errors);

  await ctx.env.DB.prepare('UPDATE patients SET unit_id = ?, shift = ? WHERE id = ?')
    .bind(parsed.value.unitId, parsed.value.shift, id)
    .run();

  await ctx.env.DB.prepare(
    `INSERT INTO assignment_history (patient_id, unit_id, shift, changed_by)
     VALUES (?, ?, ?, ?)`
  )
    .bind(id, parsed.value.unitId, parsed.value.shift, ctx.user!.id)
    .run();

  await writeAudit(ctx.env, ctx.user!.id, 'reassign_patient', 'patient', id);
  return json({ ok: true });
};

export const updatePatientStatus: RouteHandler = async (request, ctx) => {
  const id = Number(ctx.params.id);
  if (!Number.isInteger(id)) return error('Invalid patient id', 400);

  const body = await parseJson(request);
  const parsed = validateStatus(body);
  if (!parsed.ok) return error('Validation failed', 400, parsed.errors);

  await ctx.env.DB.prepare('UPDATE patients SET status = ? WHERE id = ?')
    .bind(parsed.value.status, id)
    .run();

  await ctx.env.DB.prepare(
    `INSERT INTO status_history (patient_id, status, changed_by) VALUES (?, ?, ?)`
  )
    .bind(id, parsed.value.status, ctx.user!.id)
    .run();

  await writeAudit(ctx.env, ctx.user!.id, 'update_status', 'patient', id, parsed.value.status);
  return json({ ok: true });
};

export const getPatient: RouteHandler = async (_request, ctx) => {
  const id = Number(ctx.params.id);
  if (!Number.isInteger(id)) return error('Invalid patient id', 400);

  const row = await ctx.env.DB.prepare(
    `SELECT id, first_name, last_name, dob, sticky_note, unit_id, shift, status, active, created_at
     FROM patients WHERE id = ? AND active = 1`
  )
    .bind(id)
    .first<PatientRow>();

  if (!row) return error('Patient not found', 404);
  await writeAudit(ctx.env, ctx.user!.id, 'view_patient', 'patient', id);
  return json({ patient: mapPatient(row) });
};

export const getPatientSummary: RouteHandler = async (_request, ctx) => {
  const id = Number(ctx.params.id);
  if (!Number.isInteger(id)) return error('Invalid patient id', 400);

  const month = ctx.url.searchParams.get('month') ?? currentMonthInClinic();
  const { start, end } = monthDateRange(month);

  const counts = await ctx.env.DB.prepare(
    `SELECT
       COUNT(*) as visit_logged_count,
       SUM(CASE WHEN note_type = 'comprehensive' THEN 1 ELSE 0 END) as comprehensive_count,
       SUM(CASE WHEN note_type = 'basic' THEN 1 ELSE 0 END) as basic_count
     FROM visits
     WHERE patient_id = ? AND visit_date >= ? AND visit_date <= ?`
  )
    .bind(id, start, end)
    .first<{ visit_logged_count: number; comprehensive_count: number; basic_count: number }>();

  const comprehensiveCount = counts?.comprehensive_count ?? 0;
  const basicCount = counts?.basic_count ?? 0;
  const visitLoggedCount = counts?.visit_logged_count ?? 0;

  return json({
    summary: {
      patientId: id,
      month,
      monthlyNoteDone: comprehensiveCount >= MONTHLY_NOTE_TARGET,
      weeklyNotesCount: basicCount,
      visitLoggedCount,
      comprehensiveCount,
      basicCount,
      monthlyTarget: MONTHLY_NOTE_TARGET,
      weeklyTarget: WEEKLY_NOTE_TARGET,
    },
  });
};
