import type { NoteType, PatientStatus, Shift, UserRole, VisitMode } from './constants.js';

export interface Unit {
  id: number;
  name: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  active: boolean;
  mustChangePassword: boolean;
  createdAt: string;
}

export interface UserPublic {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  active: boolean;
  mustChangePassword: boolean;
}

export interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  dob: string;
  stickyNote: string;
  unitId: number;
  shift: Shift;
  status: PatientStatus;
  active: boolean;
  createdAt: string;
}

export interface Visit {
  id: number;
  patientId: number;
  userId: number;
  visitDate: string;
  noteType: NoteType;
  seenOnHd: boolean;
  monthlyNote: boolean;
  cipa: boolean;
  notes: string;
  assessment: string;
  visitLogged: boolean;
  attestedAt: string | null;
  attestedBy: number | null;
  attestedByName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PatientSummary {
  patientId: number;
  month: string;
  monthlyNoteDone: boolean;
  weeklyNotesCount: number;
  visitLoggedCount: number;
  comprehensiveCount: number;
  basicCount: number;
  monthlyTarget: number;
  weeklyTarget: number;
  pendingSignOffCount: number;
}

export interface PatientWithProgress extends Patient {
  comprehensiveCount: number;
  basicCount: number;
  visitLoggedCount: number;
  lastVisitDate: string | null;
  lastNoteType: NoteType | null;
  monthlyTarget: number;
  weeklyTarget: number;
  unattestedVisitCount: number;
}

export interface ComplianceRow {
  patientId: number;
  firstName: string;
  lastName: string;
  dob: string;
  status: PatientStatus;
  monthlyNoteDone: boolean;
  weeklyVisitCount: number;
  missingMonthlyNote: boolean;
  unattestedVisitCount: number;
  attestedVisitCount: number;
}

export interface AttestVisitRow {
  visitId: number;
  visitDate: string;
  noteType: NoteType;
  patientId: number;
  firstName: string;
  lastName: string;
  authorName: string;
  attestedAt: string | null;
  attestedByName: string | null;
  seenOnHd: boolean;
  cipa: boolean;
  notes: string;
  assessment: string;
}

export interface AttestQueueItem {
  unitId: number;
  unitName: string;
  shift: Shift;
  visitDate: string;
  pendingCount: number;
  totalCount: number;
  visitMode: VisitMode | null;
}

export interface AttestSession {
  unitId: number;
  unitName: string;
  shift: Shift;
  visitDate: string;
  visitMode: VisitMode | null;
  pendingCount: number;
  totalCount: number;
  visits: AttestVisitRow[];
}

export interface AttestShiftBucket {
  unitId: number;
  unitName: string;
  shift: Shift;
  visitDate: string;
  visitMode: VisitMode | null;
  pendingCount: number;
  totalCount: number;
  visits: AttestVisitRow[];
}

export interface AttestDayUnitGroup {
  unitId: number;
  unitName: string;
  shifts: AttestShiftBucket[];
}

export interface AttestDayBoard {
  date: string;
  pendingCount: number;
  totalCount: number;
  units: AttestDayUnitGroup[];
}

export interface UpdateAttestSessionRequest {
  unitId: number;
  shift: Shift;
  visitDate: string;
  visitMode: VisitMode;
}

export interface BatchAttestRequest {
  visitIds: number[];
}

export interface ApiError {
  error: string;
  details?: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  role: UserRole;
  password: string;
}

export interface CreatePatientRequest {
  firstName: string;
  lastName: string;
  dob: string;
  unitId: number;
  shift: Shift;
  stickyNote?: string;
}

export interface UpdatePatientRequest {
  firstName?: string;
  lastName?: string;
  dob?: string;
  stickyNote?: string;
}

export interface AssignmentRequest {
  unitId: number;
  shift: Shift;
}

export interface StatusRequest {
  status: PatientStatus;
}

export interface CreateVisitRequest {
  patientId: number;
  visitDate: string;
  noteType: NoteType;
  seenOnHd: boolean;
  monthlyNote?: boolean;
  cipa: boolean;
  notes?: string;
  assessment?: string;
}

export interface UpdateVisitRequest {
  noteType?: NoteType;
  seenOnHd?: boolean;
  monthlyNote?: boolean;
  cipa?: boolean;
  notes?: string;
  assessment?: string;
}

export interface ImportRequest {
  unitId: number;
  shift: Shift;
  rows: Array<{ firstName: string; lastName: string; dob: string }>;
}

export interface ImportResult {
  added: number;
  skipped: number;
}
