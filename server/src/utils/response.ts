export function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

export function error(message: string, status = 400, details?: string[]): Response {
  return json({ error: message, details }, status);
}

export async function parseJson<T = unknown>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export function csvResponse(filename: string, content: string): Response {
  return new Response(content, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

export const SESSION_COOKIE = 'dr_session';

export function setSessionCookie(token: string, maxAgeSeconds: number, secure = true): string {
  const secureFlag = secure ? 'Secure; ' : '';
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; ${secureFlag}SameSite=Strict; Max-Age=${maxAgeSeconds}`;
}

export function clearSessionCookie(secure = true): string {
  const secureFlag = secure ? 'Secure; ' : '';
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; ${secureFlag}SameSite=Strict; Max-Age=0`;
}

export function getSessionToken(request: Request): string | null {
  const cookie = request.headers.get('Cookie') ?? '';
  for (const part of cookie.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === SESSION_COOKIE) return rest.join('=');
  }
  return null;
}

export function applySecurityHeaders(
  response: Response,
  options: {
    production?: boolean;
    noindex?: boolean;
    noai?: boolean;
    noStore?: boolean;
  } = {}
): Response {
  const headers = new Headers(response.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (options.noStore) {
    headers.set('Cache-Control', 'no-store');
  }
  if (options.noindex || options.noai) {
    const tags = [
      ...(options.noindex ? ['noindex', 'nofollow'] : []),
      ...(options.noai ? ['noai', 'noimageai'] : []),
    ];
    headers.set('X-Robots-Tag', tags.join(', '));
  }
  if (options.production) {
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
