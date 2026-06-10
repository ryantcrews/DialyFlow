import { MONTHLY_NOTE_TARGET, WEEKLY_NOTE_TARGET } from '@dialyrounds/shared';

export type PreviewPatient = {
  lastName: string;
  firstName: string;
  shift: string;
  dob: string;
  comprehensiveCount: number;
  basicCount: number;
  complete?: boolean;
  needsComp?: boolean;
  unattestedCount?: number;
  lastVisit?: string;
  accentColor?: string;
};

export const PREVIEW_PATIENTS: PreviewPatient[] = [
  {
    lastName: 'Wilson',
    firstName: 'Linda',
    shift: 'MWF AM',
    dob: '1958-03-12',
    comprehensiveCount: 1,
    basicCount: 3,
    complete: true,
    lastVisit: 'Jun 6',
  },
  {
    lastName: 'Martinez',
    firstName: 'James',
    shift: 'MWF AM',
    dob: '1962-07-22',
    comprehensiveCount: 0,
    basicCount: 1,
    needsComp: true,
    unattestedCount: 1,
    lastVisit: 'Jun 8',
    accentColor: '#2563eb',
  },
  {
    lastName: 'Thomas',
    firstName: 'Robert',
    shift: 'MWF AM',
    dob: '1955-11-04',
    comprehensiveCount: 0,
    basicCount: 0,
    needsComp: true,
    lastVisit: 'No visits this month',
  },
  {
    lastName: 'King',
    firstName: 'Susan',
    shift: 'MWF AM',
    dob: '1968-09-18',
    comprehensiveCount: 1,
    basicCount: 2,
    lastVisit: 'Jun 5',
  },
];

export const PREVIEW_PATIENTS_COMPACT = PREVIEW_PATIENTS.slice(0, 2);

export function previewCompleteCount(patients: PreviewPatient[]): number {
  return patients.filter(
    (p) =>
      p.comprehensiveCount >= MONTHLY_NOTE_TARGET && p.basicCount >= WEEKLY_NOTE_TARGET
  ).length;
}

export function previewNeedsCompCount(patients: PreviewPatient[]): number {
  return patients.filter((p) => p.comprehensiveCount < MONTHLY_NOTE_TARGET).length;
}
