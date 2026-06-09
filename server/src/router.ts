import type { Middleware, RouteHandler } from './env.js';

interface Route {
  method: string;
  pattern: URLPattern;
  handler: RouteHandler;
  middleware?: Middleware[];
}

export class Router {
  private routes: Route[] = [];

  on(
    method: string,
    pathname: string,
    handler: RouteHandler,
    middleware: Middleware[] = []
  ): this {
    this.routes.push({
      method: method.toUpperCase(),
      pattern: new URLPattern({ pathname }),
      handler,
      middleware,
    });
    return this;
  }

  async handle(request: Request, ctx: Parameters<RouteHandler>[1]): Promise<Response | null> {
    const url = new URL(request.url);
    for (const route of this.routes) {
      if (route.method !== request.method.toUpperCase()) continue;
      const match = route.pattern.exec(url);
      if (!match) continue;
      ctx.params = match.pathname.groups as Record<string, string>;
      ctx.url = url;

      const run = async (index: number): Promise<Response> => {
        if (index < (route.middleware?.length ?? 0)) {
          return route.middleware![index](request, ctx, () => run(index + 1));
        }
        return route.handler(request, ctx);
      };
      return run(0);
    }
    return null;
  }
}
