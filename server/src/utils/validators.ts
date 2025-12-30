import { z } from 'zod';

export const emailSchema = z.string().email('Invalid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

export const dateSchema = z.union([
  z.string().datetime(),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  z.date(),
]);

export const visitTypeSchema = z.enum(['in-person', 'telemedicine']);

export const userRoleSchema = z.enum(['admin', 'doctor', 'billing']);

export const shiftCodeSchema = z.enum([
  'MWF_FIRST',
  'MWF_SECOND',
  'TTH_SAT_FIRST',
  'TTH_SAT_SECOND',
  'PD',
]);

export const unitNameSchema = z.enum([
  'West Iredell',
  'Taylorsville',
  'Lake Norman',
  'Statesville',
  'Wilkesboro',
]);
