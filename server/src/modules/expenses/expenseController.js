import crypto from 'crypto';
import { db } from '../../db/database.js';
import { logAuditAction } from '../../middleware/auditLogger.js';

const DEFAULT_CATEGORIES = [
  { id: 'cat-food', name: 'Food', icon: 'Utensils', color: '#ef4444' },
  { id: 'cat-travel', name: 'Travel', icon: 'Plane', color: '#3b82f6' },
  { id: 'cat-fuel', name: 'Fuel', icon: 'Fuel', color: '#f59e0b' },
  { id: 'cat-shopping', name: 'Shopping', icon: 'ShoppingBag', color: '#ec4899' },
  { id: 'cat-rent', name: 'Rent', icon: 'Home', color: '#8b5cf6' },
  { id: 'cat-medical', name: 'Medical', icon: 'Cross', color: '#10b981' },
  { id: 'cat-entertainment', name: 'Entertainment', icon: 'Film', color: '#06b6d4' },
  { id: 'cat-education', name: 'Education', icon: 'GraduationCap', color: '#6366f1' },
  { id: 'cat-others', name: 'Others', icon: 'MoreHorizontal', color: '#6b7280' }
];

export const expenseController = {
  async getPersonalExpenses(req, res, next) {
    try {
      const userId = req.user.id;
      const { search, category, paymentMethod, startDate, endDate, sortBy, order } = req.query;

      let expenses = db.find('personal_expenses', e => e.user_id === userId);

      // Apply Filters
      if (category && category !== 'ALL') {
        expenses = expenses.filter(e => e.category.toLowerCase() === category.toLowerCase());
      }
      if (paymentMethod && paymentMethod !== 'ALL') {
        expenses = expenses.filter(e => e.payment_method === paymentMethod);
      }
      if (startDate) {
        expenses = expenses.filter(e => new Date(e.date) >= new Date(startDate));
      }
      if (endDate) {
        expenses = expenses.filter(e => new Date(e.date) <= new Date(endDate));
      }
      if (search) {
        const query = search.toLowerCase();
        expenses = expenses.filter(e => 
          e.description.toLowerCase().includes(query) ||
          e.category.toLowerCase().includes(query) ||
          e.amount.toString().includes(query)
        );
      }

      // Sorting
      const sortKey = sortBy || 'date';
      const sortOrder = order === 'asc' ? 1 : -1;
      expenses.sort((a, b) => {
        if (sortKey === 'amount') return (a.amount - b.amount) * sortOrder;
        return (new Date(b.date) - new Date(a.date)) * sortOrder;
      });

      return res.json({ success: true, count: expenses.length, data: expenses });
    } catch (err) {
      next(err);
    }
  },

  async addPersonalExpense(req, res, next) {
    try {
      const userId = req.user.id;
      const { amount, category, description, date, paymentMethod } = req.body;

      const newExpense = {
        id: crypto.randomUUID(),
        user_id: userId,
        amount: Number(amount),
        category: category.trim(),
        description: description.trim(),
        date: date || new Date().toISOString().split('T')[0],
        payment_method: paymentMethod || 'UPI',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      db.insert('personal_expenses', newExpense);
      logAuditAction(userId, 'PERSONAL_EXPENSE_ADDED', req, { expenseId: newExpense.id, amount });

      return res.status(201).json({ success: true, message: 'Expense added successfully.', data: newExpense });
    } catch (err) {
      next(err);
    }
  },

  async editPersonalExpense(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { amount, category, description, date, paymentMethod } = req.body;

      const expense = db.findOne('personal_expenses', e => e.id === id && e.user_id === userId);
      if (!expense) {
        return res.status(404).json({ success: false, error: 'Personal expense not found.' });
      }

      const updated = {
        ...expense,
        amount: amount !== undefined ? Number(amount) : expense.amount,
        category: category !== undefined ? category.trim() : expense.category,
        description: description !== undefined ? description.trim() : expense.description,
        date: date !== undefined ? date : expense.date,
        payment_method: paymentMethod !== undefined ? paymentMethod : expense.payment_method,
        updated_at: new Date().toISOString()
      };

      db.update('personal_expenses', e => e.id === id, updated);
      logAuditAction(userId, 'PERSONAL_EXPENSE_UPDATED', req, { expenseId: id });

      return res.json({ success: true, message: 'Expense updated successfully.', data: updated });
    } catch (err) {
      next(err);
    }
  },

  async deletePersonalExpense(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const removedCount = db.remove('personal_expenses', e => e.id === id && e.user_id === userId);
      if (removedCount === 0) {
        return res.status(404).json({ success: false, error: 'Personal expense not found.' });
      }

      logAuditAction(userId, 'PERSONAL_EXPENSE_DELETED', req, { expenseId: id });

      return res.json({ success: true, message: 'Expense deleted successfully.' });
    } catch (err) {
      next(err);
    }
  },

  async getCategories(req, res, next) {
    try {
      const userId = req.user.id;
      const customCats = db.find('custom_categories', c => c.user_id === userId);

      const formattedCustom = customCats.map(c => ({
        id: c.id,
        name: c.name,
        icon: c.icon || 'Tag',
        color: c.color || '#3b82f6',
        isCustom: true
      }));

      return res.json({
        success: true,
        data: [...DEFAULT_CATEGORIES, ...formattedCustom]
      });
    } catch (err) {
      next(err);
    }
  },

  async createCustomCategory(req, res, next) {
    try {
      const userId = req.user.id;
      const { name, icon, color } = req.body;

      const newCategory = {
        id: crypto.randomUUID(),
        user_id: userId,
        name: name.trim(),
        icon: icon || 'Tag',
        color: color || '#3b82f6',
        created_at: new Date().toISOString()
      };

      db.insert('custom_categories', newCategory);
      logAuditAction(userId, 'CUSTOM_CATEGORY_CREATED', req, { categoryName: name });

      return res.status(201).json({ success: true, message: 'Custom category created.', data: newCategory });
    } catch (err) {
      next(err);
    }
  }
};
