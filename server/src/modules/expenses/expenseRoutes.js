import { Router } from 'express';
import { z } from 'zod';
import { expenseController } from './expenseController.js';
import { validateRequest } from '../../middleware/inputValidator.js';
import { authGuard } from '../../middleware/authGuard.js';

const router = Router();

const addExpenseSchema = z.object({
  body: z.object({
    amount: z.number().positive('Amount must be greater than 0'),
    category: z.string().min(1, 'Category is required'),
    description: z.string().min(1, 'Description is required'),
    date: z.string().optional(),
    paymentMethod: z.enum(['Cash', 'UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Others']).optional()
  })
});

const customCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Category name is required').max(30),
    icon: z.string().optional(),
    color: z.string().optional()
  })
});

router.use(authGuard);

router.get('/personal', expenseController.getPersonalExpenses);
router.post('/personal', validateRequest(addExpenseSchema), expenseController.addPersonalExpense);
router.put('/personal/:id', expenseController.editPersonalExpense);
router.delete('/personal/:id', expenseController.deletePersonalExpense);

router.get('/categories', expenseController.getCategories);
router.post('/categories/custom', validateRequest(customCategorySchema), expenseController.createCustomCategory);

export default router;
