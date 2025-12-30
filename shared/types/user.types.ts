// User Types
export type UserRole = 'admin' | 'doctor' | 'billing';

export interface User {
  _id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  assignedUnits?: string[]; // Unit IDs
  assignedShifts?: string[]; // Shift IDs
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCreateDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  assignedUnits?: string[];
  assignedShifts?: string[];
}

export interface UserUpdateDTO {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  isActive?: boolean;
  assignedUnits?: string[];
  assignedShifts?: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
}

export interface TwoFactorVerify {
  userId: string;
  token: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface AuthUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  twoFactorEnabled: boolean;
  assignedUnits?: string[];
  assignedShifts?: string[];
}
