import {
  MONTHLY_NOTE_TARGET,
  monthDateRange,
  monthFromDate,
  dateFromMonthParam,
  shiftMatchesDate,
  todayInClinic,
  validateDateParam,
  weekDateRangeForDate,
  weeklyBasicTargetForDate,
  validateAssignment,
  validateCreatePatient,
  validateStatus,
  validateUpdatePatient,
} from '@dialyrounds/shared';
import type { NoteType, Patient, PatientStatus, Shift } from '@dialyrounds/shared';
import type { RouteHandler } from '../env.js';
import { auditKv, patientAuditLabel, writeAudit } from '../utils/audit.js';
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
  admission_date: string;
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
    admissionDate: row.admission_date ?? row.created_at.slice(0, 10),
    createdAt: row.created_at,
  };
}

function resolveListDate(ctx: { url: URL }): { ok: true; date: string } | { ok: false; errors: string[] } {
  const dateParam = ctx.url.searchParams.get('date');
  if (dateParam) {
    const check = validateDateParam(dateParam, 'date');
    if (!check.ok) return check;
    return { ok: true, date: check.value };
  }
  const monthParam = ctx.url.searchParams.get('month');
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const shift = ctx.url.searchParams.get('shift') ?? 'MWF AM';
    return { ok: true, date: dateFromMonthParam(monthParam, shift) };
  }
  return { ok: true, date: todayInClinic() };
}

export const listPatients: RouteHandler = async (_request, ctx) => {
  const unitId = ctx.url.searchParams.get('unit');
  const shift = ctx.url.searchParams.get('shift');
  const status = ctx.url.searchParams.get('status') ?? 'active';

  const dateResult = resolveListDate(ctx);
  if (!dateResult.ok) return error('Validation failed', 400, dateResult.errors);

  const selectedDate = dateResult.date;

  if (!unitId || !shift) return error('unit and shift query params are required', 400);

  if (!shiftMatchesDate(shift, selectedDate)) {
    return json({
      date: selectedDate,
      shiftMatchesDay: false,
      patients: [],
    });
  }

  const month = monthFromDate(selectedDate);
  const { start: monthStart, end: monthEnd } = monthDateRange(month);
  const { start: weekStart, end: weekEnd } = weekDateRangeForDate(selectedDate);
  const monthEndCap = monthEnd < selectedDate ? monthEnd : selectedDate;
  const weekEndCap = weekEnd < selectedDate ? weekEnd : selectedDate;
  const weeklyTarget = weeklyBasicTargetForDate(shift, selectedDate);

  let query = `SELECT p.id, p.first_name, p.last_name, p.dob, p.sticky_note, p.unit_id, p.shift, p.status, p.active,
                      p.admission_date, p.created_at,
                      COALESCE(comp.comprehensive_count, 0) as comprehensive_count,
                      COALESCE(basic.basic_count, 0) as basic_count,
                      COALESCE(logged.visit_logged_count, 0) as visit_logged_count,
                      COALESCE(unattested.unattested_count, 0) as unattested_count,
                      last_visit.last_visit_date,
                      lv.note_type as last_note_type
               FROM patients p
               LEFT JOIN (
                 SELECT patient_id,
                        SUM(CASE WHEN note_type = 'comprehensive' THEN 1 ELSE 0 END) as comprehensive_count
                 FROM visits
                 WHERE visit_date >= ? AND visit_date <= ?
                 GROUP BY patient_id
               ) comp ON comp.patient_id = p.id
               LEFT JOIN (
                 SELECT patient_id,
                        SUM(CASE WHEN note_type = 'basic' THEN 1 ELSE 0 END) as basic_count
                 FROM visits
                 WHERE visit_date >= ? AND visit_date <= ?
                 GROUP BY patient_id
               ) basic ON basic.patient_id = p.id
               LEFT JOIN (
                 SELECT patient_id, COUNT(*) as visit_logged_count
                 FROM visits
                 WHERE visit_date >= ? AND visit_date <= ? AND visit_logged = 1
                 GROUP BY patient_id
               ) logged ON logged.patient_id = p.id
               LEFT JOIN (
                 SELECT patient_id,
                        SUM(CASE WHEN attested_at IS NULL AND visit_logged = 1 THEN 1 ELSE 0 END) as unattested_count
                 FROM visits
                 WHERE visit_date >= ? AND visit_date <= ?
                 GROUP BY patient_id
               ) unattested ON unattested.patient_id = p.id
               LEFT JOIN (
                 SELECT patient_id, MAX(visit_date) as last_visit_date
                 FROM visits
                 WHERE visit_date <= ?
                 GROUP BY patient_id
               ) last_visit ON last_visit.patient_id = p.id
               LEFT JOIN visits lv ON lv.id = (
                 SELECT id FROM visits
                 WHERE patient_id = p.id AND visit_date <= ?
                 ORDER BY visit_date DESC, created_at DESC, id DESC
                 LIMIT 1
               )
               WHERE p.active = 1
                 AND p.unit_id = ?
                 AND p.shift = ?
                 AND date(p.admission_date) <= date(?)`;

  const binds: unknown[] = [
    monthStart,
    monthEndCap,
    weekStart,
    weekEndCap,
    monthStart,
    monthEndCap,
    monthStart,
    monthEndCap,
    selectedDate,
    selectedDate,
    Number(unitId),
    shift,
    selectedDate,
  ];

  if (status !== 'all') {
    query += ` AND COALESCE(
      (SELECT sh.status FROM status_history sh
       WHERE sh.patient_id = p.id AND date(sh.effective_from) <= date(?)
       ORDER BY sh.effective_from DESC, sh.id DESC LIMIT 1),
      p.status
    ) = ?`;
    binds.push(selectedDate, status);
  }

  query += ' ORDER BY p.last_name, p.first_name';

  const { results } = await ctx.env.DB.prepare(query).bind(...binds).all<
    PatientRow & {
      comprehensive_count: number;
      basic_count: number;
      visit_logged_count: number;
      unattested_count: number;
      last_visit_date: string | null;
      last_note_type: NoteType | null;
    }
  >();

  return json({
    date: selectedDate,
    shiftMatchesDay: true,
    patients: (results ?? []).map((row) => ({
      ...mapPatient(row),
      comprehensiveCount: row.comprehensive_count,
      basicCount: row.basic_count,
      visitLoggedCount: row.visit_logged_count,
      lastVisitDate: row.last_visit_date,
      lastNoteType: row.last_note_type,
      monthlyTarget: MONTHLY_NOTE_TARGET,
      weeklyTarget,
      unattestedVisitCount: row.unattested_count,
    })),
  });
};

export const createPatient: RouteHandler = async (request, ctx) => {
  const body = await parseJson(request);
  const parsed = validateCreatePatient(body);
  if (!parsed.ok) return error('Validation failed', 400, parsed.errors);

  const admissionDate = parsed.value.admissionDate ?? todayInClinic();

  try {
    const result = await ctx.env.DB.prepare(
      `INSERT INTO patients (first_name, last_name, dob, sticky_note, unit_id, shift, admission_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        parsed.value.firstName,
        parsed.value.lastName,
        parsed.value.dob,
        parsed.value.stickyNote ?? '',
        parsed.value.unitId,
        parsed.value.shift,
        admissionDate
      )
      .run();

    const patientId = result.meta.last_row_id as number;
    await ctx.env.DB.prepare(
      `INSERT INTO assignment_history (patient_id, unit_id, shift, changed_by)
       VALUES (?, ?, ?, ?)`
    )
      .bind(patientId, parsed.value.unitId, parsed.value.shift, ctx.user!.id)
      .run();

    await writeAudit(
      ctx.env,
      ctx.user!.id,
      'create_patient',
      'patient',
      patientId,
      auditKv({
        patient: `${parsed.value.lastName}, ${parsed.value.firstName}`,
        shift: parsed.value.shift,
        admissionDate,
      })
    );
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

  await writeAudit(
    ctx.env,
    ctx.user!.id,
    'update_patient',
    'patient',
    id,
    auditKv({ patient: await patientAuditLabel(ctx.env.DB, id) })
  );
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
    `SELECT id, first_name, last_name, dob, sticky_note, unit_id, shift, status, active, admission_date, created_at
     FROM patients WHERE id = ? AND active = 1`
  )
    .bind(id)
    .first<PatientRow>();

  if (!row) return error('Patient not found', 404);
  return json({ patient: mapPatient(row) });
};

export const getPatientSummary: RouteHandler = async (_request, ctx) => {
  const id = Number(ctx.params.id);
  if (!Number.isInteger(id)) return error('Invalid patient id', 400);

  const patient = await ctx.env.DB.prepare(
    'SELECT shift FROM patients WHERE id = ? AND active = 1'
  )
    .bind(id)
    .first<{ shift: string }>();
  if (!patient) return error('Patient not found', 404);

  const dateParam = ctx.url.searchParams.get('date');
  const monthParam = ctx.url.searchParams.get('month');
  let selectedDate: string;
  if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    selectedDate = dateParam;
  } else if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    selectedDate = dateFromMonthParam(monthParam, patient.shift);
  } else {
    selectedDate = todayInClinic();
  }

  const month = monthFromDate(selectedDate);
  const { start: monthStart, end: monthEnd } = monthDateRange(month);
  const { start: weekStart, end: weekEnd } = weekDateRangeForDate(selectedDate);
  const monthEndCap = monthEnd < selectedDate ? monthEnd : selectedDate;
  const weekEndCap = weekEnd < selectedDate ? weekEnd : selectedDate;
  const weeklyTarget = weeklyBasicTargetForDate(patient.shift, selectedDate);

  const monthCounts = await ctx.env.DB.prepare(
    `SELECT
       COUNT(*) as visit_logged_count,
       SUM(CASE WHEN note_type = 'comprehensive' THEN 1 ELSE 0 END) as comprehensive_count,
       SUM(CASE WHEN attested_at IS NULL AND visit_logged = 1 THEN 1 ELSE 0 END) as pending_sign_off_count
     FROM visits
     WHERE patient_id = ? AND visit_date >= ? AND visit_date <= ?`
  )
    .bind(id, monthStart, monthEndCap)
    .first<{
      visit_logged_count: number;
      comprehensive_count: number;
      pending_sign_off_count: number;
    }>();

  const weekCounts = await ctx.env.DB.prepare(
    `SELECT SUM(CASE WHEN note_type = 'basic' THEN 1 ELSE 0 END) as basic_count
     FROM visits
     WHERE patient_id = ? AND visit_date >= ? AND visit_date <= ?`
  )
    .bind(id, weekStart, weekEndCap)
    .first<{ basic_count: number }>();

  const comprehensiveCount = monthCounts?.comprehensive_count ?? 0;
  const basicCount = weekCounts?.basic_count ?? 0;
  const visitLoggedCount = monthCounts?.visit_logged_count ?? 0;
  const pendingSignOffCount = monthCounts?.pending_sign_off_count ?? 0;

  return json({
    summary: {
      patientId: id,
      month,
      date: selectedDate,
      monthlyNoteDone: comprehensiveCount >= MONTHLY_NOTE_TARGET,
      weeklyNotesCount: basicCount,
      visitLoggedCount,
      comprehensiveCount,
      basicCount,
      monthlyTarget: MONTHLY_NOTE_TARGET,
      weeklyTarget,
      pendingSignOffCount,
    },
  });
};
