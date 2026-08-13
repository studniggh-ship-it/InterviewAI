import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', SettingsController.getSettings);
router.put('/', SettingsController.updateSettings);

export default router;
