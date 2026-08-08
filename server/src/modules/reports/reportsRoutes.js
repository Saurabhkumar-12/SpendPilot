import { Router } from 'express';
import { reportsController } from './reportsController.js';
import { authGuard } from '../../middleware/authGuard.js';

const router = Router();

router.use(authGuard);

router.get('/dashboard', reportsController.getDashboardSummary);
router.get('/analytics', reportsController.getReports);

export default router;
