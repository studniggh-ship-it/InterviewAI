import { Router } from 'express';
import { ProfileController } from '../controllers/profile.controller';
import { authenticateToken } from '../middleware/auth';
import { uploadAvatar } from '../middleware/upload';

const router = Router();

router.use(authenticateToken);
router.get('/', (req, res) => ProfileController.getProfile(req, res));
router.put('/', (req, res) => ProfileController.updateProfile(req, res));
router.post('/avatar', uploadAvatar.single('avatar'), (req, res) => ProfileController.uploadAvatar(req, res));

export default router;

