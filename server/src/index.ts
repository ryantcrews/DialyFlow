import {
  appHostForEnvironment,
  isApiHost,
  isAppHost,
  isMarketingHost,
  shouldNoindex,
} from '@dialyrounds/shared';
import type { Env } from './env.js';
import { Router } from './router.js';
import { requireAdmin, requireAuth } from './middleware/auth.js';
import {
  isApiHost,
  rejectDisallowedApiOrigin,
  requirePasswordChanged,
} from './middleware/api-access.js';
import {
  bootstrap,
  changePassword,
  createUser,
  ensureAdminUser,
  listUsers,
  login,
  logout,
  me,
  resetUserPassword,
  updateUser,
} from './routes/auth.js';
import { listAuditLog } from './routes/audit-log.js';
import {
  batchAttest,
  attestVisit,
  getAttestDay,
  getAttestSession,
  listAttestQueue,
  listAttestVisits,
  updateAttestSession,
} from './routes/attest.js';
import {
  complianceReport,
  complianceReportExport,
  exportPatients,
  importPatients,
} from './routes/import-export.js';
import {
  createPatient,
  deletePatient,
  getPatient,
  getPatientSummary,
  listPatients,
  reassignPatient,
  updatePatient,
  updatePatientStatus,
} from './routes/patients.js';
import { listUnits } from './routes/units.js';
import { createVisit, listVisits, updateVisit } from './routes/visits.js';
import { buildRobotsTxt, robotsPolicy } from './utils/robots.js';
import { applySecurityHeaders, json } from './utils/response.js';

const auth = [requireAuth];
const authClinical = [...auth, requirePasswordChanged];
const admin = [...authClinical, requireAdmin];

const APP_PATH_PREFIXES = [
  '/login',
  '/patients',
  '/attest',
  '/import',
  '/reports',
  '/admin',
];

function isAppPath(pathname: string): boolean {
  return APP_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function createRouter(): Router {
  const router = new Router();

  router.on('POST', '/api/auth/login', login);
  router.on('POST', '/api/bootstrap', bootstrap);
  router.on('POST', '/api/auth/logout', logout, auth);
  router.on('GET', '/api/auth/me', me, auth);
  router.on('POST', '/api/auth/change-password', changePassword, auth);

  router.on('GET', '/api/users', listUsers, admin);
  router.on('POST', '/api/users', createUser, admin);
  router.on('PATCH', '/api/users/:id', updateUser, admin);
  router.on('POST', '/api/users/:id/reset-password', resetUserPassword, admin);
  router.on('GET', '/api/audit-log', listAuditLog, admin);

  router.on('GET', '/api/units', listUnits, authClinical);

  router.on('GET', '/api/patients', listPatients, authClinical);
  router.on('POST', '/api/patients', createPatient, authClinical);
  router.on('PATCH', '/api/patients/:id/assignment', reassignPatient, admin);
  router.on('PATCH', '/api/patients/:id/status', updatePatientStatus, admin);
  router.on('GET', '/api/patients/:id/summary', getPatientSummary, authClinical);
  router.on('GET', '/api/patients/:id/visits', listVisits, authClinical);
  router.on('GET', '/api/patients/:id', getPatient, authClinical);
  router.on('PATCH', '/api/patients/:id', updatePatient, authClinical);
  router.on('DELETE', '/api/patients/:id', deletePatient, admin);

  router.on('POST', '/api/visits', createVisit, authClinical);
  router.on('PATCH', '/api/visits/:id', updateVisit, authClinical);

  router.on('GET', '/api/attest/day', getAttestDay, authClinical);
  router.on('GET', '/api/attest/queue', listAttestQueue, authClinical);
  router.on('GET', '/api/attest/session', getAttestSession, authClinical);
  router.on('PATCH', '/api/attest/session', updateAttestSession, authClinical);
  router.on('GET', '/api/attest', listAttestVisits, authClinical);
  router.on('POST', '/api/attest/batch', batchAttest, authClinical);
  router.on('POST', '/api/attest/:id', attestVisit, authClinical);

  router.on('POST', '/api/import', importPatients, authClinical);
  router.on('GET', '/api/export', exportPatients, authClinical);
  router.on('GET', '/api/reports/compliance', complianceReport, admin);
  router.on('GET', '/api/reports/compliance/export', complianceReportExport, admin);

  return router;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (env.ENVIRONMENT !== 'production') {
      await ensureAdminUser(env.DB);
    }

    const url = new URL(request.url);
    const host = url.hostname;
    const production = env.ENVIRONMENT === 'production';

    if (host === 'www.dialyrounds.com') {
      return Response.redirect(`https://dialyrounds.com${url.pathname}${url.search}`, 301);
    }

    if (url.pathname === '/robots.txt') {
      const blockCrawlers = shouldNoindex(host, env.ENVIRONMENT);
      const body = buildRobotsTxt(host, env.ENVIRONMENT);
      return applySecurityHeaders(
        new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }),
        {
          production,
          noindex: blockCrawlers,
          noai: robotsPolicy(host, env.ENVIRONMENT) === 'block-all',
        }
      );
    }

    if (isMarketingHost(host, env.ENVIRONMENT) && isAppPath(url.pathname)) {
      const appHost = appHostForEnvironment(env.ENVIRONMENT);
      return Response.redirect(`https://${appHost}${url.pathname}${url.search}`, 301);
    }

    if (url.pathname.startsWith('/api/')) {
      if (isMarketingHost(host, env.ENVIRONMENT) || !isApiHost(host, env.ENVIRONMENT)) {
        return applySecurityHeaders(json({ error: 'Not found' }, 404), {
          production,
          noStore: true,
        });
      }

      const originReject = rejectDisallowedApiOrigin(request, production, url.pathname);
      if (originReject) {
        return applySecurityHeaders(originReject, { production, noStore: true });
      }

      const router = createRouter();
      const ctx = {
        env,
        user: null,
        params: {},
        url,
      };
      const response = await router.handle(request, ctx);
      const result = response ?? json({ error: 'Not found' }, 404);
      return applySecurityHeaders(result, { production, noindex: true, noai: true, noStore: true });
    }

    const assetResponse = await env.ASSETS.fetch(request);
    const blockCrawlers = shouldNoindex(host, env.ENVIRONMENT);
    return applySecurityHeaders(assetResponse, {
      production,
      noindex: blockCrawlers,
      noai: blockCrawlers,
    });
  },
};
