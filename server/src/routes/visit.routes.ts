import { Router } from 'express';
import { visitController } from '../controllers/visit.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { auditMiddleware } from '../middleware/audit.middleware';
import { doctorOrAdmin } from '../middleware/role.middleware';

const router = Router();

router.use(authMiddleware);
router.use(doctorOrAdmin);

router.get('/', visitController.getAll);
router.get('/:id', visitController.getById);
router.get('/patient/:patientId', visitController.getPatientVisits);
router.post('/', auditMiddleware('CREATE', 'VISIT'), visitController.create);
router.put('/:id', auditMiddleware('UPDATE', 'VISIT'), visitController.update);
router.delete('/:id', auditMiddleware('DELETE', 'VISIT'), visitController.delete);

export default router;
