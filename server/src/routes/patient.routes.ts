import { Router } from 'express';
import { patientController } from '../controllers/patient.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { auditMiddleware } from '../middleware/audit.middleware';
import { adminOnly, doctorOrAdmin } from '../middleware/role.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', doctorOrAdmin, patientController.getAll);
router.get('/:id', doctorOrAdmin, patientController.getById);
router.post('/', adminOnly, auditMiddleware('CREATE', 'PATIENT'), patientController.create);
router.put('/:id', adminOnly, auditMiddleware('UPDATE', 'PATIENT'), patientController.update);
router.delete('/:id', adminOnly, auditMiddleware('DELETE', 'PATIENT'), patientController.delete);

export default router;
