import type { ApiError } from '@dialyrounds/shared';

export class ApiClientError extends Error {
  details?: string[];

  constructor(message: string, details?: string[]) {
    super(message);
    this.details = details;
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  const contentType = response.headers.get('Content-Type') ?? '';
  if (contentType.includes('text/csv')) {
    const blob = await response.blob();
    return blob as unknown as T;
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = data as ApiError;
    throw new ApiClientError(err.error ?? 'Request failed', err.details);
  }
  return data as T;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function downloadCsv(path: string, filename: string): Promise<void> {
  const response = await fetch(path, { credentials: 'include' });
  if (!response.ok) throw new ApiClientError('Export failed');
  const blob = await response.blob();
  downloadBlob(blob, filename);
}
