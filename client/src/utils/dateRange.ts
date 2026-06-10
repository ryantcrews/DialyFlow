export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function weekRangeFrom(date = new Date()): { start: string; end: string } {
  const d = new Date(date);
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().slice(0, 10),
    end: sunday.toISOString().slice(0, 10),
  };
}

export function formatDisplayDate(iso: string): string {
  const parsed = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export type DateRangePreset = 'today' | 'week' | 'custom';

export function presetRange(preset: DateRangePreset): { start: string; end: string } {
  if (preset === 'today') {
    const t = todayIsoDate();
    return { start: t, end: t };
  }
  return weekRangeFrom();
}
