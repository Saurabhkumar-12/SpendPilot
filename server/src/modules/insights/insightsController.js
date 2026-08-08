import { db } from '../../db/database.js';
import { aiInsightsService } from '../../services/aiInsightsService.js';
import { exchangeRateService } from '../../services/exchangeRateService.js';

export const insightsController = {
  async getAIInsights(req, res, next) {
    try {
      const userId = req.user.id;
      const userPref = db.findOne('user_preferences', p => p.user_id === userId);
      const currency = userPref ? userPref.currency : '₹';

      const personalExpenses = db.find('personal_expenses', e => e.user_id === userId);
      
      const memberRecords = db.find('group_members', m => m.user_id === userId);
      const groupIds = memberRecords.map(m => m.group_id);
      const groupExpenses = db.find('group_expenses', e => groupIds.includes(e.group_id));

      const insights = await aiInsightsService.generateFinancialInsights(personalExpenses, groupExpenses, currency);
      return res.json({ success: true, data: insights });
    } catch (err) {
      next(err);
    }
  },

  async convertCurrency(req, res, next) {
    try {
      const { amount, from, to } = req.query;
      if (!amount || !from || !to) {
        return res.status(400).json({ success: false, error: 'Parameters amount, from, and to are required.' });
      }

      const converted = await exchangeRateService.convertCurrency(Number(amount), from.toUpperCase(), to.toUpperCase());
      return res.json({ success: true, from, to, amount: Number(amount), convertedAmount: converted });
    } catch (err) {
      next(err);
    }
  }
};
