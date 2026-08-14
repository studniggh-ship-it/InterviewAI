import { Router } from 'express';
import { InterviewController } from '../controllers/interview.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.post('/start', (req, res) => InterviewController.startInterview(req, res));
router.get('/:id', (req, res) => InterviewController.getSessionDetails(req, res));
router.post('/:id/next', (req, res) => InterviewController.submitAnswerAndNext(req, res));
router.get('/:id/question/:index', (req, res) => InterviewController.getQuestionAtIndex(req, res));
router.post('/:id/finish', (req, res) => InterviewController.finishInterview(req, res));
router.get('/:id/feedback', (req, res) => InterviewController.getFeedback(req, res));

export default router;


