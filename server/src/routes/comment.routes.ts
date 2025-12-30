import { Router } from 'express';
import { commentController } from '../controllers/comment.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { auditMiddleware } from '../middleware/audit.middleware';
import { doctorOrAdmin } from '../middleware/role.middleware';

const router = Router();

router.use(authMiddleware);
router.use(doctorOrAdmin);

router.get('/visit/:visitId', commentController.getByVisit);
router.post('/', auditMiddleware('CREATE', 'COMMENT'), commentController.create);
router.put('/:id', auditMiddleware('UPDATE', 'COMMENT'), commentController.update);
router.delete('/:id', auditMiddleware('DELETE', 'COMMENT'), commentController.delete);

export default router;
