import { Router } from 'express';
import { z } from 'zod';
import { settlementController } from './settlementController.js';
import { validateRequest } from '../../middleware/inputValidator.js';
import { authGuard } from '../../middleware/authGuard.js';

const router = Router();

const markSettledSchema = z.object({
  body: z.object({
    groupId: z.string().min(1, 'Group ID is required'),
    payerId: z.string().min(1, 'Payer ID is required'),
    payeeId: z.string().min(1, 'Payee ID is required'),
    amount: z.number().positive('Settlement amount must be positive'),
    notes: z.string().optional()
  })
});

router.use(authGuard);

router.get('/pending', settlementController.getPendingSettlements);
router.post('/settle', validateRequest(markSettledSchema), settlementController.markAsSettled);
router.get('/history', settlementController.getSettlementHistory);

export default router;
