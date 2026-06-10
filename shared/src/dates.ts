import { CLINIC_TIMEZONE, SHIFTS, type Shift } from './constants.js';

const WEEKDAY_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export function todayInClinic(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: CLINIC_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function currentMonthInClinic(): string {
  return todayInClinic().slice(0, 7);
}

export function monthFromDate(isoDate: string): string {
  return isoDate.slice(0, 7);
}

export function monthDateRange(month: string): { start: string; end: string } {
  const [year, mon] = month.split('-').map(Number);
  const start = `${month}-01`;
  const lastDay = new Date(Date.UTC(year, mon, 0)).getUTCDate();
  const end = `${month}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
}

export function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(year, month - 1, day + days));
  return dt.toISOString().slice(0, 10);
}

export function weekdayInClinic(isoDate: string): number {
  const short = new Intl.DateTimeFormat('en-US', {
    timeZone: CLINIC_TIMEZONE,
    weekday: 'short',
  }).format(new Date(`${isoDate}T12:00:00Z`));
  return WEEKDAY_MAP[short] ?? 0;
}

export function shiftMatchesDate(shift: Shift | string, isoDate: string): boolean {
  const day = weekdayInClinic(isoDate);
  if (shift.startsWith('MWF')) return day === 1 || day === 3 || day === 5;
  if (shift.startsWith('TTS')) return day === 2 || day === 4 || day === 6;
  return false;
}

export function shiftExpectedDays(shift: Shift | string): string {
  return shift.startsWith('MWF') ? 'Monday, Wednesday, Friday' : 'Tuesday, Thursday, Saturday';
}

export function weekDateRangeForDate(isoDate: string): { start: string; end: string } {
  const day = weekdayInClinic(isoDate);
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = addDays(isoDate, diffToMonday);
  return { start, end: addDays(start, 6) };
}

/** Dialysis dates for a shift within an inclusive ISO date range. */
export function dialysisDatesInRange(
  shift: Shift | string,
  startDate: string,
  endDate: string
): string[] {
  const dates: string[] = [];
  let cur = startDate;
  while (cur <= endDate) {
    if (shiftMatchesDate(shift, cur)) dates.push(cur);
    cur = addDays(cur, 1);
  }
  return dates;
}

/**
 * Basic note target for the calendar week containing `isoDate`, counting only
 * shift dialysis days on or before the selected date (max 3 for MWF/TTS).
 */
export function weeklyBasicTargetForDate(shift: Shift | string, isoDate: string): number {
  const { start, end } = weekDateRangeForDate(isoDate);
  const endCap = end < isoDate ? end : isoDate;
  return dialysisDatesInRange(shift, start, endCap).length;
}

/** Previous / next shift dialysis dates within two weeks of the selected day. */
export function nearestShiftDates(
  shift: Shift | string,
  isoDate: string
): { previous: string | null; next: string | null } {
  let previous: string | null = null;
  for (let i = 1; i <= 14; i++) {
    const candidate = addDays(isoDate, -i);
    if (shiftMatchesDate(shift, candidate)) {
      previous = candidate;
      break;
    }
  }
  let next: string | null = null;
  for (let i = 1; i <= 14; i++) {
    const candidate = addDays(isoDate, i);
    if (shiftMatchesDate(shift, candidate)) {
      next = candidate;
      break;
    }
  }
  return { previous, next };
}

export function isDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const dt = new Date(Date.UTC(year, month - 1, day));
  return (
    dt.getUTCFullYear() === year && dt.getUTCMonth() === month - 1 && dt.getUTCDate() === day
  );
}

/** Map legacy month URLs to a concrete roster date. */
export function dateFromMonthParam(month: string, shift: Shift | string): string {
  const today = todayInClinic();
  if (month === monthFromDate(today)) return today;
  const { end } = monthDateRange(month);
  if (shiftMatchesDate(shift, end)) return end;
  for (let i = 0; i < 7; i++) {
    const candidate = addDays(end, -i);
    if (monthFromDate(candidate) === month && shiftMatchesDate(shift, candidate)) {
      return candidate;
    }
  }
  return end;
}

export function isShift(value: string): value is Shift {
  return (SHIFTS as readonly string[]).includes(value);
}
