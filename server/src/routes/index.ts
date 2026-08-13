import { Router } from 'express';
import authRoutes from './auth.routes';
import profileRoutes from './profile.routes';
import interviewRoutes from './interview.routes';
import resumeRoutes from './resume.routes';
import historyRoutes from './history.routes';
import dashboardRoutes from './dashboard.routes';
import settingsRoutes from './settings.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/interviews', interviewRoutes);
router.use('/resume', resumeRoutes);
router.use('/history', historyRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/settings', settingsRoutes);

export default router;
