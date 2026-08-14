import { Router } from 'express';
import { ResumeController } from '../controllers/resume.controller';
import { authenticateToken } from '../middleware/auth';
import { uploadResume } from '../middleware/upload';

const router = Router();

router.use(authenticateToken);

router.post('/analyze', uploadResume.single('resume'), (req, res) => ResumeController.analyzeResume(req, res));
router.get('/latest', (req, res) => ResumeController.getLatestAnalysis(req, res));

export default router;

