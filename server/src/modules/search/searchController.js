import { db } from '../../db/database.js';

export const searchController = {
  async globalSearch(req, res, next) {
    try {
      const userId = req.user.id;
      const { q } = req.query;

      if (!q || q.trim().length === 0) {
        return res.json({ success: true, data: { personalExpenses: [], groupExpenses: [], groups: [] } });
      }

      const query = q.toLowerCase().trim();

      // Search Personal Expenses
      const personalExpenses = db.find('personal_expenses', e =>
        e.user_id === userId && (
          e.description.toLowerCase().includes(query) ||
          e.category.toLowerCase().includes(query) ||
          e.payment_method.toLowerCase().includes(query) ||
          e.amount.toString().includes(query)
        )
      );

      // Search User's Groups
      const memberRecords = db.find('group_members', m => m.user_id === userId);
      const groupIds = memberRecords.map(m => m.group_id);
      const groups = db.find('groups', g =>
        groupIds.includes(g.id) && (
          g.name.toLowerCase().includes(query) ||
          g.group_type.toLowerCase().includes(query) ||
          (g.description && g.description.toLowerCase().includes(query))
        )
      );

      // Search Group Expenses
      const groupExpenses = db.find('group_expenses', e =>
        groupIds.includes(e.group_id) && (
          e.description.toLowerCase().includes(query) ||
          e.category.toLowerCase().includes(query) ||
          e.amount.toString().includes(query)
        )
      ).map(e => {
        const group = db.findOne('groups', g => g.id === e.group_id);
        return { ...e, groupName: group ? group.name : 'Group' };
      });

      return res.json({
        success: true,
        data: {
          personalExpenses,
          groupExpenses,
          groups
        }
      });
    } catch (err) {
      next(err);
    }
  }
};
