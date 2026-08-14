import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimit';

const router = Router();

router.post('/register', authRateLimiter, (req, res) => AuthController.register(req, res));
router.post('/login', authRateLimiter, (req, res) => AuthController.login(req, res));
router.post('/logout', authenticateToken, (req, res) => AuthController.logout(req, res));
router.get('/me', authenticateToken, (req, res) => AuthController.me(req, res));
router.post('/forgot-password', authRateLimiter, (req, res) => AuthController.forgotPassword(req, res));

export default router;

