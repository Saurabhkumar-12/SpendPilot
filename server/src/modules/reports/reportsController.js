import { db } from '../../db/database.js';
import { calculateOptimalSettlements } from '../../utils/settlementSolver.js';

export const reportsController = {
  async getDashboardSummary(req, res, next) {
    try {
      const userId = req.user.id;
      const todayStr = new Date().toISOString().split('T')[0];
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();

      // Personal Expenses
      const personalExpenses = db.find('personal_expenses', e => e.user_id === userId);

      // Group Memberships & Expenses
      const memberRecords = db.find('group_members', m => m.user_id === userId);
      const groupIds = memberRecords.map(m => m.group_id);

      let groupShareTotal = 0;
      let groupToday = 0;
      let groupMonthly = 0;
      let groupYearly = 0;
      const groupExpensesList = [];

      groupIds.forEach(gId => {
        const gExpenses = db.find('group_expenses', e => e.group_id === gId);
        gExpenses.forEach(e => {
          const splits = db.find('expense_splits', s => s.expense_id === e.id && s.user_id === userId);
          if (splits.length > 0) {
            const userOwed = Number(splits[0].amount_owed);
            groupShareTotal += userOwed;
            groupExpensesList.push({ ...e, userShare: userOwed, isGroup: true });

            const expDate = new Date(e.date);
            if (e.date === todayStr) groupToday += userOwed;
            if (expDate.getFullYear() === currentYear && expDate.getMonth() === currentMonth) groupMonthly += userOwed;
            if (expDate.getFullYear() === currentYear) groupYearly += userOwed;
          }
        });
      });

      // Personal stats
      let personalTotal = 0;
      let personalToday = 0;
      let personalMonthly = 0;
      let personalYearly = 0;

      personalExpenses.forEach(e => {
        const amt = Number(e.amount);
        personalTotal += amt;
        const expDate = new Date(e.date);
        if (e.date === todayStr) personalToday += amt;
        if (expDate.getFullYear() === currentYear && expDate.getMonth() === currentMonth) personalMonthly += amt;
        if (expDate.getFullYear() === currentYear) personalYearly += amt;
      });

      // Calculate total debts owed & receivable across groups
      let totalOwe = 0;
      let totalReceive = 0;

      groupIds.forEach(gId => {
        const members = db.find('group_members', m => m.group_id === gId);
        const expenses = db.find('group_expenses', e => e.group_id === gId);

        const balanceMap = {};
        members.forEach(m => { balanceMap[m.user_id] = 0; });

        expenses.forEach(e => {
          balanceMap[e.paid_by_id] = (balanceMap[e.paid_by_id] || 0) + Number(e.amount);
          const splits = db.find('expense_splits', s => s.expense_id === e.id);
          splits.forEach(s => {
            balanceMap[s.user_id] = (balanceMap[s.user_id] || 0) - Number(s.amount_owed);
          });
        });

        const settledList = db.find('settlements', s => s.group_id === gId && s.status === 'SETTLED');
        settledList.forEach(s => {
          balanceMap[s.payer_id] = (balanceMap[s.payer_id] || 0) + Number(s.amount);
          balanceMap[s.payee_id] = (balanceMap[s.payee_id] || 0) - Number(s.amount);
        });

        const minTxns = calculateOptimalSettlements(Object.entries(balanceMap).map(([uId, net]) => ({ userId: uId, netBalance: net })));
        minTxns.forEach(t => {
          if (t.payerId === userId) totalOwe += t.amount;
          if (t.payeeId === userId) totalReceive += t.amount;
        });
      });

      // Recent combined expenses
      const allRecent = [
        ...personalExpenses.map(e => ({ ...e, source: 'Personal', totalAmount: e.amount })),
        ...groupExpensesList.map(e => ({ ...e, source: 'Group', totalAmount: e.amount, amount: e.userShare }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 7);

      // Category breakdown for chart
      const categoryTotals = {};
      personalExpenses.forEach(e => {
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + Number(e.amount);
      });

      // Monthly spending trend (last 6 months)
      const monthlyTrend = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const y = d.getFullYear();
        const m = d.getMonth();
        const monthLabel = d.toLocaleString('default', { month: 'short' });

        const monthPersonal = personalExpenses
          .filter(e => { const ed = new Date(e.date); return ed.getFullYear() === y && ed.getMonth() === m; })
          .reduce((sum, e) => sum + Number(e.amount), 0);

        monthlyTrend.push({ month: monthLabel, amount: monthPersonal });
      }

      const recentSettlements = db.find('settlements', s => s.payer_id === userId || s.payee_id === userId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)
        .map(s => {
          const payer = db.findOne('users', u => u.id === s.payer_id);
          const payee = db.findOne('users', u => u.id === s.payee_id);
          return {
            ...s,
            payerName: payer ? payer.name : 'Unknown',
            payeeName: payee ? payee.name : 'Unknown'
          };
        });

      return res.json({
        success: true,
        data: {
          summary: {
            totalExpenses: personalTotal + groupShareTotal,
            todayExpenses: personalToday + groupToday,
            monthlyExpenses: personalMonthly + groupMonthly,
            yearlyExpenses: personalYearly + groupYearly,
            groupCount: groupIds.length,
            amountOwe: Math.round(totalOwe * 100) / 100,
            amountReceive: Math.round(totalReceive * 100) / 100
          },
          recentExpenses: allRecent,
          recentSettlements,
          categoryBreakdown: categoryTotals,
          monthlyTrend
        }
      });
    } catch (err) {
      next(err);
    }
  },

  async getReports(req, res, next) {
    try {
      const userId = req.user.id;
      const { timeframe } = req.query; // daily, weekly, monthly, yearly

      const personalExpenses = db.find('personal_expenses', e => e.user_id === userId);
      const totalSpent = personalExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const count = personalExpenses.length;
      const avgSpent = count > 0 ? Math.round((totalSpent / count) * 100) / 100 : 0;

      // Category breakdown
      const categoryMap = {};
      personalExpenses.forEach(e => {
        categoryMap[e.category] = (categoryMap[e.category] || 0) + Number(e.amount);
      });

      const topCategories = Object.entries(categoryMap)
        .map(([name, amount]) => ({ name, amount, percentage: Math.round((amount / (totalSpent || 1)) * 100) }))
        .sort((a, b) => b.amount - a.amount);

      return res.json({
        success: true,
        data: {
          timeframe: timeframe || 'monthly',
          totalSpent,
          totalTransactions: count,
          averageSpentPerTransaction: avgSpent,
          topCategories,
          categoryMap
        }
      });
    } catch (err) {
      next(err);
    }
  }
};
