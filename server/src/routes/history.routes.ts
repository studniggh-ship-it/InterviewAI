import { Router } from 'express';
import { HistoryController } from '../controllers/history.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', (req, res) => HistoryController.getHistory(req, res));
router.delete('/:id', (req, res) => HistoryController.deleteInterview(req, res));

export default router;

