import { Router } from 'express';
import { unitController } from '../controllers/unit.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { adminOnly, doctorOrAdmin } from '../middleware/role.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', doctorOrAdmin, unitController.getAll);
router.get('/:id', doctorOrAdmin, unitController.getById);
router.post('/', adminOnly, unitController.create);
router.put('/:id', adminOnly, unitController.update);

export default router;
