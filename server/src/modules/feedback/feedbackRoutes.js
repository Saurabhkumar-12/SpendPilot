import { Router } from 'express';
import { z } from 'zod';
import { feedbackController } from './feedbackController.js';
import { validateRequest } from '../../middleware/inputValidator.js';
import { apiRateLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

const feedbackSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(50),
    role: z.string().optional(),
    rating: z.number().min(1).max(5),
    message: z.string().min(5, 'Feedback message must be at least 5 characters').max(500)
  })
});

router.get('/', feedbackController.getFeedback);
router.post('/', apiRateLimiter, validateRequest(feedbackSchema), feedbackController.submitFeedback);

export default router;
