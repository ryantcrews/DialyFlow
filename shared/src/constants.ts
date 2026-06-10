export const NOTE_TYPES = ['comprehensive', 'basic'] as const;
export type NoteType = (typeof NOTE_TYPES)[number];

export const MONTHLY_NOTE_TARGET = 1;
export const WEEKLY_NOTE_TARGET = 3;

export const SHIFTS = ['MWF AM', 'MWF PM', 'TTS AM', 'TTS PM'] as const;
export type Shift = (typeof SHIFTS)[number];

export const VISIT_MODES = ['telemed', 'in_person'] as const;
export type VisitMode = (typeof VISIT_MODES)[number];

export const VISIT_MODE_LABELS: Record<VisitMode, string> = {
  telemed: 'Telemed',
  in_person: 'In person',
};

export const PATIENT_STATUSES = [
  'active',
  'hospitalized',
  'discharged',
  'transferred',
  'deceased',
] as const;
export type PatientStatus = (typeof PATIENT_STATUSES)[number];

export const USER_ROLES = ['admin', 'physician', 'physician_assistant'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  physician: 'Physician',
  physician_assistant: 'Physician Assistant',
};

export function isClinicalRole(role: UserRole): boolean {
  return role === 'physician' || role === 'physician_assistant';
}

export const CLINIC_TIMEZONE = 'America/New_York';

export const SEED_UNITS = [
  'West Iredell WFB',
  'Wilkesboro WFB',
  'Davie WFB',
  'Statesville WFB',
  'Lake Norman WFB',
  'Taylorsville FMC',
] as const;

export const SESSION_IDLE_MS = 60 * 60 * 1000;
export const SESSION_MAX_MS = 24 * 60 * 60 * 1000;
export const LOGIN_MAX_ATTEMPTS = 5;
export const LOGIN_LOCKOUT_MS = 15 * 60 * 1000;
