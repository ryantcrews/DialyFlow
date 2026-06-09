import type { RouteHandler } from '../env.js';
import { json } from '../utils/response.js';

export const listUnits: RouteHandler = async (_request, ctx) => {
  const { results } = await ctx.env.DB.prepare('SELECT id, name FROM units ORDER BY name').all<{
    id: number;
    name: string;
  }>();
  return json({ units: results ?? [] });
};
