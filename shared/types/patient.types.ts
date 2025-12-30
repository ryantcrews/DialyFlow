// Patient Types
export interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  unit: string; // Unit ID
  shift: string; // Shift ID
  medicalRecordNumber?: string;
  isActive: boolean;
  isManualEntry?: boolean; // Track if patient was manually entered
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PatientCreateDTO {
  firstName: string;
  lastName: string;
  dateOfBirth: Date | string;
  unit: string;
  shift: string;
  medicalRecordNumber?: string;
  isManualEntry?: boolean;
  notes?: string;
}

export interface PatientUpdateDTO {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date | string;
  unit?: string;
  shift?: string;
  medicalRecordNumber?: string;
  isActive?: boolean;
  notes?: string;
}

export interface PatientWithDetails extends Patient {
  unitName?: string;
  shiftName?: string;
}

export interface PatientFilter {
  unit?: string;
  shift?: string;
  search?: string; // Search by name or MRN
  isActive?: boolean;
}
