export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  ENVIRONMENT: string;
}

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'clinician';
  mustChangePassword: boolean;
}

export interface RequestContext {
  env: Env;
  user: AuthUser | null;
  params: Record<string, string>;
  url: URL;
}

export type RouteHandler = (
  request: Request,
  ctx: RequestContext
) => Promise<Response> | Response;

export type Middleware = (
  request: Request,
  ctx: RequestContext,
  next: () => Promise<Response>
) => Promise<Response>;
