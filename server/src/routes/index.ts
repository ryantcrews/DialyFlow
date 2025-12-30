import { Router } from 'express';
import authRoutes from './auth.routes';
import patientRoutes from './patient.routes';
import visitRoutes from './visit.routes';
import commentRoutes from './comment.routes';
import unitRoutes from './unit.routes';
import shiftRoutes from './shift.routes';
import adminRoutes from './admin.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/patients', patientRoutes);
router.use('/visits', visitRoutes);
router.use('/comments', commentRoutes);
router.use('/units', unitRoutes);
router.use('/shifts', shiftRoutes);
router.use('/admin', adminRoutes);

export default router;
