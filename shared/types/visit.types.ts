import { VisitType } from './common.types';

// Visit Types
export interface Visit {
  _id: string;
  patient: string; // Patient ID
  visitDate: Date;
  visitType: VisitType;
  unit: string; // Unit ID
  shift: string; // Shift ID
  recordCompleted: boolean;
  carePlanDone: boolean; // Weekly note
  cipaDone: boolean; // Monthly note
  billingCodes: string[];
  referrals: string[];
  provider: string; // User ID
  createdAt: Date;
  updatedAt: Date;
}

export interface VisitCreateDTO {
  patient: string;
  visitDate: Date | string;
  visitType: VisitType;
  unit: string;
  shift: string;
  recordCompleted?: boolean;
  carePlanDone?: boolean;
  cipaDone?: boolean;
  billingCodes?: string[];
  referrals?: string[];
}

export interface VisitUpdateDTO {
  visitDate?: Date | string;
  visitType?: VisitType;
  recordCompleted?: boolean;
  carePlanDone?: boolean;
  cipaDone?: boolean;
  billingCodes?: string[];
  referrals?: string[];
}

export interface VisitWithDetails extends Visit {
  patientName?: string;
  patientDOB?: Date;
  providerName?: string;
  unitName?: string;
  shiftName?: string;
  comments?: Comment[];
}

export interface VisitFilter {
  patient?: string;
  unit?: string;
  shift?: string;
  visitType?: VisitType;
  startDate?: Date | string;
  endDate?: Date | string;
  provider?: string;
}

// Comment Types
export interface Comment {
  _id: string;
  visit: string; // Visit ID
  patient: string; // Patient ID
  text: string;
  author: string; // User ID
  authorName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentCreateDTO {
  visit: string;
  patient: string;
  text: string;
}

export interface CommentUpdateDTO {
  text: string;
}

// Export Types
export interface ExportRequest {
  startDate: Date | string;
  endDate: Date | string;
  format: 'excel' | 'csv';
  units?: string[]; // Filter by units
  shifts?: string[]; // Filter by shifts
  visitType?: VisitType;
}

export interface ExportData {
  patientName: string;
  dateOfBirth: string;
  visitDate: string;
  visitType: string;
  unit: string;
  shift: string;
  recordCompleted: string;
  carePlanDone: string;
  cipaDone: string;
  billingCodes: string;
  referrals: string;
  provider: string;
}
