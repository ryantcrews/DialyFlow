import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { exportController } from '../controllers/export.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { auditMiddleware } from '../middleware/audit.middleware';
import { adminOnly, billingOrAdmin } from '../middleware/role.middleware';

const router = Router();

router.use(authMiddleware);

// User management routes
router.get('/users', adminOnly, userController.getAll);
router.get('/users/:id', adminOnly, userController.getById);
router.post('/users', adminOnly, auditMiddleware('CREATE', 'USER'), userController.create);
router.put('/users/:id', adminOnly, auditMiddleware('UPDATE', 'USER'), userController.update);
router.delete('/users/:id', adminOnly, auditMiddleware('DELETE', 'USER'), userController.delete);

// Export routes
router.post('/export', billingOrAdmin, auditMiddleware('EXPORT', 'EXPORT'), exportController.exportData);

export default router;
