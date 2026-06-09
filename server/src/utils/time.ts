import { SESSION_IDLE_MS, SESSION_MAX_MS } from '@dialyrounds/shared';

export function nowIso(): string {
  return new Date().toISOString();
}

export function addMs(iso: string, ms: number): string {
  return new Date(new Date(iso).getTime() + ms).toISOString();
}

export function sessionExpiry(): { expiresAt: string; maxAgeSeconds: number } {
  const expiresAt = addMs(nowIso(), SESSION_MAX_MS);
  return { expiresAt, maxAgeSeconds: Math.floor(SESSION_MAX_MS / 1000) };
}

export function isExpired(iso: string | null | undefined): boolean {
  if (!iso) return true;
  return new Date(iso).getTime() <= Date.now();
}

export function isIdleExpired(lastSeenAt: string | null | undefined): boolean {
  if (!lastSeenAt) return true;
  return Date.now() - new Date(lastSeenAt).getTime() > SESSION_IDLE_MS;
}

export function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function toCsv(headers: string[], rows: string[][]): string {
  const lines = [headers.map(escapeCsv).join(',')];
  for (const row of rows) {
    lines.push(row.map((cell) => escapeCsv(String(cell ?? ''))).join(','));
  }
  return lines.join('\r\n');
}
