import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken as any);

router.get('/stats', (req, res) => DashboardController.getStats(req, res));
router.get('/progress', (req, res) => DashboardController.getProgress(req, res));

export default router;
