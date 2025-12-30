import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { auditMiddleware } from '../middleware/audit.middleware';

const router = Router();

router.post('/register', authController.register);
router.post('/login', auditMiddleware('LOGIN', 'AUTH'), authController.login);
router.post('/verify-2fa', authController.verifyTwoFactor);
router.post('/logout', authMiddleware, auditMiddleware('LOGOUT', 'AUTH'), authController.logout);

router.get('/me', authMiddleware, authController.me);
router.post('/setup-2fa', authMiddleware, authController.setupTwoFactor);
router.post('/enable-2fa', authMiddleware, authController.enableTwoFactor);
router.post('/disable-2fa', authMiddleware, authController.disableTwoFactor);

export default router;
