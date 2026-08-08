import { Router } from 'express';
import { z } from 'zod';
import { groupController } from './groupController.js';
import { validateRequest } from '../../middleware/inputValidator.js';
import { authGuard } from '../../middleware/authGuard.js';

const router = Router();

const createGroupSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Group name must be at least 2 characters').max(50),
    description: z.string().optional(),
    groupType: z.enum(['Trip', 'Friends', 'Family', 'Office', 'Roommates', 'College', 'Event', 'Custom']).optional()
  })
});

const inviteMemberSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Member name is required'),
    email: z.string().email('Invalid member email address').optional().or(z.literal(''))
  })
});

const addGroupExpenseSchema = z.object({
  body: z.object({
    amount: z.number().positive('Amount must be positive'),
    category: z.string().min(1, 'Category is required'),
    description: z.string().min(1, 'Description is required'),
    date: z.string().optional(),
    paidById: z.string().min(1, 'Payer ID is required'),
    splitType: z.enum(['EQUAL', 'PERCENTAGE', 'EXACT']),
    splits: z.array(z.object({
      userId: z.string(),
      amountOwed: z.number(),
      percentage: z.number().optional()
    })).min(1, 'At least 1 participant split entry required')
  })
});

router.use(authGuard);

router.get('/', groupController.getGroups);
router.post('/', validateRequest(createGroupSchema), groupController.createGroup);
router.get('/:id', groupController.getGroupDetails);
router.put('/:id', groupController.editGroup);
router.delete('/:id', groupController.deleteGroup);

router.post('/:id/invite', validateRequest(inviteMemberSchema), groupController.inviteMember);
router.delete('/:id/members/:memberId', groupController.removeMember);

router.post('/:id/expenses', validateRequest(addGroupExpenseSchema), groupController.addGroupExpense);
router.put('/expenses/:expenseId', validateRequest(addGroupExpenseSchema), groupController.editGroupExpense);
router.delete('/expenses/:expenseId', groupController.deleteGroupExpense);

export default router;
