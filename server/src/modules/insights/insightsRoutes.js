import { Router } from 'express';
import { insightsController } from './insightsController.js';
import { authGuard } from '../../middleware/authGuard.js';

const router = Router();
router.use(authGuard);

router.get('/ai', insightsController.getAIInsights);
router.get('/convert', insightsController.convertCurrency);

export default router;
