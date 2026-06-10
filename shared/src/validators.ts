import {
  NOTE_TYPES,
  PATIENT_STATUSES,
  SHIFTS,
  USER_ROLES,
  VISIT_MODES,
} from './constants.js';
import type {
  AssignmentRequest,
  BatchAttestRequest,
  ChangePasswordRequest,
  CreatePatientRequest,
  CreateUserRequest,
  CreateVisitRequest,
  ImportRequest,
  LoginRequest,
  StatusRequest,
  UpdateAttestSessionRequest,
  UpdatePatientRequest,
  UpdateVisitRequest,
} from './types.js';

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: string[] };

function fail(errors: string[]): { ok: false; errors: string[] } {
  return { ok: false, errors };
}

function ok<T>(value: T): { ok: true; value: T } {
  return { ok: true, value };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

function isMonthString(value: string): boolean {
  return /^\d{4}-\d{2}$/.test(value);
}

function isPassword(value: string): boolean {
  return value.length >= 8;
}

function isOneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value);
}

function parseObject(body: unknown): Record<string, unknown> | null {
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    return body as Record<string, unknown>;
  }
  return null;
}

export function validateLogin(body: unknown): ValidationResult<LoginRequest> {
  const obj = parseObject(body);
  if (!obj) return fail(['Invalid request body']);
  const email = typeof obj.email === 'string' ? obj.email.trim().toLowerCase() : '';
  const password = typeof obj.password === 'string' ? obj.password : '';
  const errors: string[] = [];
  if (!isEmail(email)) errors.push('Valid email is required');
  if (!password) errors.push('Password is required');
  return errors.length ? fail(errors) : ok({ email, password });
}

export function validateChangePassword(body: unknown): ValidationResult<ChangePasswordRequest> {
  const obj = parseObject(body);
  if (!obj) return fail(['Invalid request body']);
  const currentPassword = typeof obj.currentPassword === 'string' ? obj.currentPassword : '';
  const newPassword = typeof obj.newPassword === 'string' ? obj.newPassword : '';
  const errors: string[] = [];
  if (!currentPassword) errors.push('Current password is required');
  if (!isPassword(newPassword)) errors.push('New password must be at least 8 characters');
  return errors.length ? fail(errors) : ok({ currentPassword, newPassword });
}

export function validateCreateUser(body: unknown): ValidationResult<CreateUserRequest> {
  const obj = parseObject(body);
  if (!obj) return fail(['Invalid request body']);
  const email = typeof obj.email === 'string' ? obj.email.trim().toLowerCase() : '';
  const name = typeof obj.name === 'string' ? obj.name.trim() : '';
  const password = typeof obj.password === 'string' ? obj.password : '';
  const role = obj.role;
  const errors: string[] = [];
  if (!isEmail(email)) errors.push('Valid email is required');
  if (!name) errors.push('Name is required');
  if (!isOneOf(role, USER_ROLES)) errors.push('Valid role is required');
  if (!isPassword(password)) errors.push('Password must be at least 8 characters');
  if (errors.length) return fail(errors);
  return ok({ email, name, role: role as (typeof USER_ROLES)[number], password });
}

export function validateCreatePatient(body: unknown): ValidationResult<CreatePatientRequest> {
  const obj = parseObject(body);
  if (!obj) return fail(['Invalid request body']);
  const firstName = typeof obj.firstName === 'string' ? obj.firstName.trim() : '';
  const lastName = typeof obj.lastName === 'string' ? obj.lastName.trim() : '';
  const dob = typeof obj.dob === 'string' ? obj.dob.trim() : '';
  const unitId = typeof obj.unitId === 'number' ? obj.unitId : Number(obj.unitId);
  const shift = obj.shift;
  const stickyNote = typeof obj.stickyNote === 'string' ? obj.stickyNote : '';
  const errors: string[] = [];
  if (!firstName) errors.push('First name is required');
  if (!lastName) errors.push('Last name is required');
  if (!isDateString(dob)) errors.push('DOB must be YYYY-MM-DD');
  if (!Number.isInteger(unitId) || unitId <= 0) errors.push('Valid unit is required');
  if (!isOneOf(shift, SHIFTS)) errors.push('Valid shift is required');
  if (errors.length) {
    return fail(errors);
  }
  return ok({
    firstName,
    lastName,
    dob,
    unitId,
    shift: shift as (typeof SHIFTS)[number],
    stickyNote,
  });
}

export function validateUpdatePatient(body: unknown): ValidationResult<UpdatePatientRequest> {
  const obj = parseObject(body);
  if (!obj) return fail(['Invalid request body']);
  const result: UpdatePatientRequest = {};
  if ('firstName' in obj) {
    if (!isNonEmptyString(obj.firstName)) return fail(['First name cannot be empty']);
    result.firstName = obj.firstName.trim();
  }
  if ('lastName' in obj) {
    if (!isNonEmptyString(obj.lastName)) return fail(['Last name cannot be empty']);
    result.lastName = obj.lastName.trim();
  }
  if ('dob' in obj) {
    if (typeof obj.dob !== 'string' || !isDateString(obj.dob)) return fail(['DOB must be YYYY-MM-DD']);
    result.dob = obj.dob.trim();
  }
  if ('stickyNote' in obj) {
    result.stickyNote = typeof obj.stickyNote === 'string' ? obj.stickyNote : '';
  }
  if (!Object.keys(result).length) return fail(['No fields to update']);
  return ok(result);
}

export function validateAssignment(body: unknown): ValidationResult<AssignmentRequest> {
  const obj = parseObject(body);
  if (!obj) return fail(['Invalid request body']);
  const unitId = typeof obj.unitId === 'number' ? obj.unitId : Number(obj.unitId);
  const shift = obj.shift;
  const errors: string[] = [];
  if (!Number.isInteger(unitId) || unitId <= 0) errors.push('Valid unit is required');
  if (!isOneOf(shift, SHIFTS)) errors.push('Valid shift is required');
  if (errors.length) return fail(errors);
  return ok({ unitId, shift: shift as (typeof SHIFTS)[number] });
}

export function validateStatus(body: unknown): ValidationResult<StatusRequest> {
  const obj = parseObject(body);
  if (!obj) return fail(['Invalid request body']);
  if (!isOneOf(obj.status, PATIENT_STATUSES)) return fail(['Valid status is required']);
  return ok({ status: obj.status });
}

export function validateCreateVisit(body: unknown): ValidationResult<CreateVisitRequest> {
  const obj = parseObject(body);
  if (!obj) return fail(['Invalid request body']);
  const patientId = typeof obj.patientId === 'number' ? obj.patientId : Number(obj.patientId);
  const visitDate = typeof obj.visitDate === 'string' ? obj.visitDate.trim() : '';
  const noteType = obj.noteType;
  const errors: string[] = [];
  if (!Number.isInteger(patientId) || patientId <= 0) errors.push('Valid patient is required');
  if (!isDateString(visitDate)) errors.push('Visit date must be YYYY-MM-DD');
  if (!isOneOf(noteType, NOTE_TYPES)) errors.push('Valid note type is required');
  const bool = (key: string) => obj[key] === true || obj[key] === 1 || obj[key] === '1';
  if (errors.length) return fail(errors);
  return ok({
    patientId,
    visitDate,
    noteType: noteType as (typeof NOTE_TYPES)[number],
    seenOnHd: bool('seenOnHd'),
    cipa: bool('cipa'),
    notes: typeof obj.notes === 'string' ? obj.notes : '',
    assessment: typeof obj.assessment === 'string' ? obj.assessment : '',
  });
}

export function validateUpdateVisit(body: unknown): ValidationResult<UpdateVisitRequest> {
  const obj = parseObject(body);
  if (!obj) return fail(['Invalid request body']);
  const result: UpdateVisitRequest = {};
  if ('noteType' in obj) {
    if (!isOneOf(obj.noteType, NOTE_TYPES)) return fail(['Valid note type is required']);
    result.noteType = obj.noteType as (typeof NOTE_TYPES)[number];
  }
  const boolField = (key: 'seenOnHd' | 'monthlyNote' | 'cipa') => {
    if (key in obj) {
      result[key] = obj[key] === true || obj[key] === 1 || obj[key] === '1';
    }
  };
  boolField('seenOnHd');
  boolField('monthlyNote');
  boolField('cipa');
  if ('notes' in obj) result.notes = typeof obj.notes === 'string' ? obj.notes : '';
  if ('assessment' in obj) result.assessment = typeof obj.assessment === 'string' ? obj.assessment : '';
  if (!Object.keys(result).length) return fail(['No fields to update']);
  return ok(result);
}

export function validateImport(body: unknown): ValidationResult<ImportRequest> {
  const obj = parseObject(body);
  if (!obj) return fail(['Invalid request body']);
  const unitId = typeof obj.unitId === 'number' ? obj.unitId : Number(obj.unitId);
  const shift = obj.shift;
  const rowsRaw = obj.rows;
  const errors: string[] = [];
  if (!Number.isInteger(unitId) || unitId <= 0) errors.push('Valid unit is required');
  if (!isOneOf(shift, SHIFTS)) errors.push('Valid shift is required');
  if (!Array.isArray(rowsRaw) || rowsRaw.length === 0) errors.push('At least one row is required');
  const rows: ImportRequest['rows'] = [];
  if (Array.isArray(rowsRaw)) {
    for (let i = 0; i < rowsRaw.length; i++) {
      const row = rowsRaw[i];
      if (!row || typeof row !== 'object') {
        errors.push(`Row ${i + 1} is invalid`);
        continue;
      }
      const r = row as Record<string, unknown>;
      const firstName = typeof r.firstName === 'string' ? r.firstName.trim() : '';
      const lastName = typeof r.lastName === 'string' ? r.lastName.trim() : '';
      const dob = typeof r.dob === 'string' ? r.dob.trim() : '';
      if (!firstName || !lastName || !isDateString(dob)) {
        errors.push(`Row ${i + 1} must include first name, last name, and DOB`);
        continue;
      }
      rows.push({ firstName, lastName, dob });
    }
  }
  if (errors.length) return fail(errors);
  return ok({ unitId, shift: shift as (typeof SHIFTS)[number], rows });
}

export function validateMonthParam(value: string | null): ValidationResult<string> {
  if (!value) return fail(['Month parameter is required (YYYY-MM)']);
  if (!isMonthString(value)) return fail(['Month must be YYYY-MM']);
  return ok(value);
}

export function validateDateParam(value: string | null, label = 'Date'): ValidationResult<string> {
  if (!value) return fail([`${label} parameter is required (YYYY-MM-DD)`]);
  if (!isDateString(value)) return fail([`${label} must be YYYY-MM-DD`]);
  return ok(value);
}

export function validateAttestQuery(params: {
  unit: string | null;
  shift: string | null;
  start: string | null;
  end: string | null;
}): ValidationResult<{ unitId: number; shift: (typeof SHIFTS)[number]; start: string; end: string }> {
  const errors: string[] = [];
  const unitId = params.unit ? Number(params.unit) : NaN;
  if (!Number.isInteger(unitId) || unitId <= 0) errors.push('Valid unit is required');
  if (!params.shift || !isOneOf(params.shift, SHIFTS)) errors.push('Valid shift is required');
  const startCheck = validateDateParam(params.start, 'Start date');
  const endCheck = validateDateParam(params.end, 'End date');
  if (!startCheck.ok) errors.push(...startCheck.errors);
  if (!endCheck.ok) errors.push(...endCheck.errors);
  if (errors.length) return fail(errors);
  const start = startCheck.ok ? startCheck.value : '';
  const end = endCheck.ok ? endCheck.value : '';
  if (start > end) return fail(['Start date must be on or before end date']);
  return ok({
    unitId,
    shift: params.shift as (typeof SHIFTS)[number],
    start,
    end,
  });
}

export function validateBatchAttest(body: unknown): ValidationResult<BatchAttestRequest> {
  const obj = parseObject(body);
  if (!obj) return fail(['Invalid request body']);
  const raw = obj.visitIds;
  if (!Array.isArray(raw) || raw.length === 0) {
    return fail(['At least one visit id is required']);
  }
  const visitIds: number[] = [];
  for (const id of raw) {
    const n = typeof id === 'number' ? id : Number(id);
    if (!Number.isInteger(n) || n <= 0) return fail(['Invalid visit id in list']);
    visitIds.push(n);
  }
  return ok({ visitIds });
}

export function validateAttestSessionQuery(params: {
  unit: string | null;
  shift: string | null;
  date: string | null;
}): ValidationResult<{ unitId: number; shift: (typeof SHIFTS)[number]; visitDate: string }> {
  const errors: string[] = [];
  const unitId = params.unit ? Number(params.unit) : NaN;
  if (!Number.isInteger(unitId) || unitId <= 0) errors.push('Valid unit is required');
  if (!params.shift || !isOneOf(params.shift, SHIFTS)) errors.push('Valid shift is required');
  const dateCheck = validateDateParam(params.date, 'Date');
  if (!dateCheck.ok) errors.push(...dateCheck.errors);
  if (errors.length) return fail(errors);
  return ok({
    unitId,
    shift: params.shift as (typeof SHIFTS)[number],
    visitDate: dateCheck.ok ? dateCheck.value : '',
  });
}

export function validateAttestDayQuery(
  date: string | null
): ValidationResult<{ date: string }> {
  const dateCheck = validateDateParam(date, 'Date');
  if (!dateCheck.ok) return dateCheck as ValidationResult<{ date: string }>;
  return ok({ date: dateCheck.value });
}

export function validateUpdateAttestSession(
  body: unknown
): ValidationResult<UpdateAttestSessionRequest> {
  const obj = parseObject(body);
  if (!obj) return fail(['Invalid request body']);
  const errors: string[] = [];
  const unitId = typeof obj.unitId === 'number' ? obj.unitId : Number(obj.unitId);
  if (!Number.isInteger(unitId) || unitId <= 0) errors.push('Valid unit is required');
  if (!isOneOf(obj.shift, SHIFTS)) errors.push('Valid shift is required');
  const visitDate = typeof obj.visitDate === 'string' ? obj.visitDate.trim() : '';
  if (!isDateString(visitDate)) errors.push('Visit date must be YYYY-MM-DD');
  if (!isOneOf(obj.visitMode, VISIT_MODES)) errors.push('Valid visit mode is required');
  if (errors.length) return fail(errors);
  return ok({
    unitId,
    shift: obj.shift as (typeof SHIFTS)[number],
    visitDate,
    visitMode: obj.visitMode as (typeof VISIT_MODES)[number],
  });
}

export function currentMonthInClinic(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
  });
  const parts = formatter.formatToParts(new Date());
  const year = parts.find((p) => p.type === 'year')?.value ?? '1970';
  const month = parts.find((p) => p.type === 'month')?.value ?? '01';
  return `${year}-${month}`;
}

export function monthDateRange(month: string): { start: string; end: string } {
  const [year, mon] = month.split('-').map(Number);
  const start = `${month}-01`;
  const lastDay = new Date(Date.UTC(year, mon, 0)).getUTCDate();
  const end = `${month}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
}
