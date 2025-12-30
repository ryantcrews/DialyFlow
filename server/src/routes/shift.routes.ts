import { Router } from 'express';
import { shiftController } from '../controllers/shift.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { adminOnly, doctorOrAdmin } from '../middleware/role.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', doctorOrAdmin, shiftController.getAll);
router.get('/:id', doctorOrAdmin, shiftController.getById);
router.post('/', adminOnly, shiftController.create);
router.put('/:id', adminOnly, shiftController.update);

export default router;
