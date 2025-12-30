// Unit Types
export type UnitName = 
  | 'West Iredell' 
  | 'Taylorsville' 
  | 'Lake Norman' 
  | 'Statesville' 
  | 'Wilkesboro';

export interface Unit {
  _id: string;
  name: UnitName;
  code: string; // Short code (e.g., 'WI', 'TAY', 'LN', 'STA', 'WIL')
  address?: string;
  phone?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UnitCreateDTO {
  name: UnitName;
  code: string;
  address?: string;
  phone?: string;
}

export interface UnitUpdateDTO {
  name?: UnitName;
  code?: string;
  address?: string;
  phone?: string;
  isActive?: boolean;
}

// Shift Types
export type ShiftCode = 
  | 'MWF_FIRST' 
  | 'MWF_SECOND' 
  | 'TTH_SAT_FIRST' 
  | 'TTH_SAT_SECOND' 
  | 'PD';

export interface Shift {
  _id: string;
  code: ShiftCode;
  name: string;
  unit: string; // Unit ID
  days: string[]; // ['Monday', 'Wednesday', 'Friday']
  startTime?: string; // '07:00'
  endTime?: string; // '11:00'
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShiftCreateDTO {
  code: ShiftCode;
  name: string;
  unit: string;
  days: string[];
  startTime?: string;
  endTime?: string;
}

export interface ShiftUpdateDTO {
  name?: string;
  days?: string[];
  startTime?: string;
  endTime?: string;
  isActive?: boolean;
}
