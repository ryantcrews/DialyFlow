import {
  currentMonthInClinic,
  monthDateRange,
  validateImport,
  validateMonthParam,
} from '@dialyrounds/shared';
import type { PatientStatus } from '@dialyrounds/shared';
import type { RouteHandler } from '../env.js';
import { writeAudit } from '../utils/audit.js';
import { csvResponse, error, json, parseJson } from '../utils/response.js';
import { toCsv } from '../utils/time.js';

export const importPatients: RouteHandler = async (request, ctx) => {
  const body = await parseJson(request);
  const parsed = validateImport(body);
  if (!parsed.ok) return error('Validation failed', 400, parsed.errors);

  let added = 0;
  let skipped = 0;

  for (const row of parsed.value.rows) {
    const existing = await ctx.env.DB.prepare(
      `SELECT id FROM patients
       WHERE active = 1 AND unit_id = ?
         AND lower(first_name) = lower(?) AND lower(last_name) = lower(?) AND dob = ?`
    )
      .bind(parsed.value.unitId, row.firstName, row.lastName, row.dob)
      .first();

    if (existing) {
      skipped++;
      continue;
    }

    const result = await ctx.env.DB.prepare(
      `INSERT INTO patients (first_name, last_name, dob, unit_id, shift)
       VALUES (?, ?, ?, ?, ?)`
    )
      .bind(row.firstName, row.lastName, row.dob, parsed.value.unitId, parsed.value.shift)
      .run();

    await ctx.env.DB.prepare(
      `INSERT INTO assignment_history (patient_id, unit_id, shift, changed_by)
       VALUES (?, ?, ?, ?)`
    )
      .bind(result.meta.last_row_id, parsed.value.unitId, parsed.value.shift, ctx.user!.id)
      .run();

    added++;
  }

  await writeAudit(
    ctx.env,
    ctx.user!.id,
    'import_patients',
    'unit',
    parsed.value.unitId,
    `added=${added},skipped=${skipped}`
  );

  return json({ added, skipped });
};

export const exportPatients: RouteHandler = async (_request, ctx) => {
  const unitId = ctx.url.searchParams.get('unit');
  const shift = ctx.url.searchParams.get('shift');
  const month = ctx.url.searchParams.get('month') ?? currentMonthInClinic();

  if (!unitId || !shift) return error('unit and shift are required', 400);
  const monthCheck = validateMonthParam(month);
  if (!monthCheck.ok) return error('Validation failed', 400, monthCheck.errors);

  const { start, end } = monthDateRange(monthCheck.value);
  const { results } = await ctx.env.DB.prepare(
    `SELECT p.first_name, p.last_name, p.dob, p.status,
            COALESCE(v.visit_count, 0) as visit_count,
            COALESCE(v.monthly_note_done, 0) as monthly_note_done
     FROM patients p
     LEFT JOIN (
       SELECT patient_id,
              COUNT(*) as visit_count,
              MAX(CASE WHEN note_type = 'comprehensive' THEN 1 ELSE 0 END) as monthly_note_done
       FROM visits
       WHERE visit_date >= ? AND visit_date <= ?
       GROUP BY patient_id
     ) v ON v.patient_id = p.id
     WHERE p.active = 1 AND p.unit_id = ? AND p.shift = ?
     ORDER BY p.last_name, p.first_name`
  )
    .bind(start, end, Number(unitId), shift)
    .all<{
      first_name: string;
      last_name: string;
      dob: string;
      status: PatientStatus;
      visit_count: number;
      monthly_note_done: number;
    }>();

  const csv = toCsv(
    ['First Name', 'Last Name', 'DOB', 'Status', 'Monthly Note Done', 'Visit Count'],
    (results ?? []).map((r) => [
      r.first_name,
      r.last_name,
      r.dob,
      r.status,
      r.monthly_note_done ? 'Yes' : 'No',
      String(r.visit_count),
    ])
  );

  await writeAudit(ctx.env, ctx.user!.id, 'export_patients', 'unit', unitId);
  return csvResponse(`patients-${month}.csv`, csv);
};

export const complianceReport: RouteHandler = async (_request, ctx) => {
  const unitId = ctx.url.searchParams.get('unit');
  const shift = ctx.url.searchParams.get('shift');
  const month = ctx.url.searchParams.get('month') ?? currentMonthInClinic();

  if (!unitId || !shift) return error('unit and shift are required', 400);
  const monthCheck = validateMonthParam(month);
  if (!monthCheck.ok) return error('Validation failed', 400, monthCheck.errors);

  const { start, end } = monthDateRange(monthCheck.value);
  const { results } = await ctx.env.DB.prepare(
    `SELECT p.id, p.first_name, p.last_name, p.dob, p.status,
            COALESCE(v.visit_count, 0) as visit_count,
            COALESCE(v.monthly_note_done, 0) as monthly_note_done,
            COALESCE(v.unattested_count, 0) as unattested_count,
            COALESCE(v.attested_count, 0) as attested_count
     FROM patients p
     LEFT JOIN (
       SELECT patient_id,
              COUNT(*) as visit_count,
              MAX(CASE WHEN note_type = 'comprehensive' THEN 1 ELSE 0 END) as monthly_note_done,
              SUM(CASE WHEN attested_at IS NULL THEN 1 ELSE 0 END) as unattested_count,
              SUM(CASE WHEN attested_at IS NOT NULL THEN 1 ELSE 0 END) as attested_count
       FROM visits
       WHERE visit_date >= ? AND visit_date <= ?
       GROUP BY patient_id
     ) v ON v.patient_id = p.id
     WHERE p.active = 1 AND p.unit_id = ? AND p.shift = ? AND p.status = 'active'
     ORDER BY p.last_name, p.first_name`
  )
    .bind(start, end, Number(unitId), shift)
    .all<{
      id: number;
      first_name: string;
      last_name: string;
      dob: string;
      status: PatientStatus;
      visit_count: number;
      monthly_note_done: number;
      unattested_count: number;
      attested_count: number;
    }>();

  const rows = (results ?? []).map((r) => ({
    patientId: r.id,
    firstName: r.first_name,
    lastName: r.last_name,
    dob: r.dob,
    status: r.status,
    monthlyNoteDone: r.monthly_note_done === 1,
    weeklyVisitCount: r.visit_count,
    missingMonthlyNote: r.monthly_note_done !== 1,
    unattestedVisitCount: r.unattested_count,
    attestedVisitCount: r.attested_count,
  }));

  return json({ month, rows });
};

export const complianceReportExport: RouteHandler = async (_request, ctx) => {
  const unitId = ctx.url.searchParams.get('unit');
  const shift = ctx.url.searchParams.get('shift');
  const month = ctx.url.searchParams.get('month') ?? currentMonthInClinic();

  if (!unitId || !shift) return error('unit and shift are required', 400);
  const monthCheck = validateMonthParam(month);
  if (!monthCheck.ok) return error('Validation failed', 400, monthCheck.errors);

  const { start, end } = monthDateRange(monthCheck.value);
  const { results } = await ctx.env.DB.prepare(
    `SELECT p.first_name, p.last_name, p.dob,
            COALESCE(v.visit_count, 0) as visit_count,
            COALESCE(v.monthly_note_done, 0) as monthly_note_done,
            COALESCE(v.unattested_count, 0) as unattested_count,
            COALESCE(v.attested_count, 0) as attested_count
     FROM patients p
     LEFT JOIN (
       SELECT patient_id,
              COUNT(*) as visit_count,
              MAX(CASE WHEN note_type = 'comprehensive' THEN 1 ELSE 0 END) as monthly_note_done,
              SUM(CASE WHEN attested_at IS NULL THEN 1 ELSE 0 END) as unattested_count,
              SUM(CASE WHEN attested_at IS NOT NULL THEN 1 ELSE 0 END) as attested_count
       FROM visits
       WHERE visit_date >= ? AND visit_date <= ?
       GROUP BY patient_id
     ) v ON v.patient_id = p.id
     WHERE p.active = 1 AND p.unit_id = ? AND p.shift = ? AND p.status = 'active'
     ORDER BY p.last_name, p.first_name`
  )
    .bind(start, end, Number(unitId), shift)
    .all<{
      first_name: string;
      last_name: string;
      dob: string;
      visit_count: number;
      monthly_note_done: number;
      unattested_count: number;
      attested_count: number;
    }>();

  const csv = toCsv(
    [
      'First Name',
      'Last Name',
      'DOB',
      'Monthly Note Done',
      'Visit Count',
      'Attested Visits',
      'Pending Attest',
      'Missing Monthly Note',
    ],
    (results ?? []).map((r) => [
      r.first_name,
      r.last_name,
      r.dob,
      r.monthly_note_done ? 'Yes' : 'No',
      String(r.visit_count),
      String(r.attested_count),
      String(r.unattested_count),
      r.monthly_note_done ? 'No' : 'Yes',
    ])
  );

  await writeAudit(ctx.env, ctx.user!.id, 'export_compliance', 'unit', unitId);
  return csvResponse(`compliance-${month}.csv`, csv);
};
