import type { Env } from './env.js';
import { Router } from './router.js';
import { requireAdmin, requireAuth } from './middleware/auth.js';
import {
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
import { json } from './utils/response.js';

const auth = [requireAuth];
const admin = [...auth, requireAdmin];

export function createRouter(): Router {
  const router = new Router();

  router.on('POST', '/api/auth/login', login);
  router.on('POST', '/api/auth/logout', logout, auth);
  router.on('GET', '/api/auth/me', me, auth);
  router.on('POST', '/api/auth/change-password', changePassword, auth);

  router.on('GET', '/api/users', listUsers, [...auth, requireAdmin]);
  router.on('POST', '/api/users', createUser, [...auth, requireAdmin]);
  router.on('PATCH', '/api/users/:id', updateUser, [...auth, requireAdmin]);
  router.on('POST', '/api/users/:id/reset-password', resetUserPassword, [...auth, requireAdmin]);

  router.on('GET', '/api/units', listUnits, auth);

  router.on('GET', '/api/patients', listPatients, auth);
  router.on('POST', '/api/patients', createPatient, auth);
  router.on('PATCH', '/api/patients/:id/assignment', reassignPatient, admin);
  router.on('PATCH', '/api/patients/:id/status', updatePatientStatus, admin);
  router.on('GET', '/api/patients/:id/summary', getPatientSummary, auth);
  router.on('GET', '/api/patients/:id/visits', listVisits, auth);
  router.on('GET', '/api/patients/:id', getPatient, auth);
  router.on('PATCH', '/api/patients/:id', updatePatient, auth);
  router.on('DELETE', '/api/patients/:id', deletePatient, admin);

  router.on('POST', '/api/visits', createVisit, auth);
  router.on('PATCH', '/api/visits/:id', updateVisit, auth);

  router.on('POST', '/api/import', importPatients, auth);
  router.on('GET', '/api/export', exportPatients, auth);
  router.on('GET', '/api/reports/compliance', complianceReport, [...auth, requireAdmin]);
  router.on('GET', '/api/reports/compliance/export', complianceReportExport, [...auth, requireAdmin]);

  return router;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    await ensureAdminUser(env.DB);

    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      const router = createRouter();
      const ctx = {
        env,
        user: null,
        params: {},
        url,
      };
      const response = await router.handle(request, ctx);
      if (response) return response;
      return json({ error: 'Not found' }, 404);
    }

    return env.ASSETS.fetch(request);
  },
};
