import crypto from 'crypto';
import { db } from '../../db/database.js';
import { calculateOptimalSettlements } from '../../utils/settlementSolver.js';
import { logAuditAction } from '../../middleware/auditLogger.js';
import { emitGroupEvent } from '../../socket.js';

export const settlementController = {
  async getPendingSettlements(req, res, next) {
    try {
      const userId = req.user.id;

      // Find user groups
      const memberRecords = db.find('group_members', m => m.user_id === userId);
      const groupIds = memberRecords.map(m => m.group_id);

      const pendingList = [];

      groupIds.forEach(gId => {
        const group = db.findOne('groups', g => g.id === gId);
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

        // Subtract already settled transactions
        const settledList = db.find('settlements', s => s.group_id === gId && s.status === 'SETTLED');
        settledList.forEach(s => {
          balanceMap[s.payer_id] = (balanceMap[s.payer_id] || 0) + Number(s.amount);
          balanceMap[s.payee_id] = (balanceMap[s.payee_id] || 0) - Number(s.amount);
        });

        const memberBalances = Object.entries(balanceMap).map(([uId, netBal]) => ({
          userId: uId,
          netBalance: netBal
        }));

        const minTransactions = calculateOptimalSettlements(memberBalances);

        minTransactions.forEach(t => {
          if (t.payerId === userId || t.payeeId === userId) {
            const payer = db.findOne('users', u => u.id === t.payerId);
            const payee = db.findOne('users', u => u.id === t.payeeId);
            pendingList.push({
              groupId: gId,
              groupName: group ? group.name : 'Group',
              payerId: t.payerId,
              payerName: payer ? payer.name : 'Unknown',
              payeeId: t.payeeId,
              payeeName: payee ? payee.name : 'Unknown',
              amount: t.amount,
              isPayer: t.payerId === userId
            });
          }
        });
      });

      return res.json({ success: true, count: pendingList.length, data: pendingList });
    } catch (err) {
      next(err);
    }
  },

  async markAsSettled(req, res, next) {
    try {
      const userId = req.user.id;
      const { groupId, payerId, payeeId, amount, notes } = req.body;

      const membership = db.findOne('group_members', m => m.group_id === groupId && m.user_id === userId);
      if (!membership) {
        return res.status(403).json({ success: false, error: 'Access denied. You are not a member of this group.' });
      }

      const numAmount = Number(amount);
      const settlementId = crypto.randomUUID();

      const settlement = {
        id: settlementId,
        group_id: groupId,
        payer_id: payerId,
        payee_id: payeeId,
        amount: numAmount,
        status: 'SETTLED',
        notes: notes ? notes.trim() : 'Marked as settled via SpendPilot',
        settled_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      db.insert('settlements', settlement);

      // Send notification to payee
      const payer = db.findOne('users', u => u.id === payerId);
      const payee = db.findOne('users', u => u.id === payeeId);
      const group = db.findOne('groups', g => g.id === groupId);

      db.insert('notifications', {
        id: crypto.randomUUID(),
        user_id: payeeId,
        title: 'Settlement Completed',
        message: `${payer ? payer.name : 'A member'} settled ${numAmount} with you in ${group ? group.name : 'group'}.`,
        type: 'SETTLEMENT',
        is_read: 0,
        metadata: JSON.stringify({ groupId, settlementId }),
        created_at: new Date().toISOString()
      });

      logAuditAction(userId, 'SETTLEMENT_RECORDED', req, { settlementId, amount: numAmount });

      // Emit Real-Time Socket.IO event to all group members
      emitGroupEvent(groupId, 'group:settlement-updated', {
        settlement,
        payerName: payer ? payer.name : 'Member',
        payeeName: payee ? payee.name : 'Member',
        groupName: group ? group.name : 'Group',
        actorName: req.user.name
      }, userId);

      return res.status(201).json({ success: true, message: 'Settlement recorded successfully.', data: settlement });
    } catch (err) {
      next(err);
    }
  },

  async getSettlementHistory(req, res, next) {
    try {
      const userId = req.user.id;
      const history = db.find('settlements', s => s.payer_id === userId || s.payee_id === userId);

      const enriched = history.map(s => {
        const group = db.findOne('groups', g => g.id === s.group_id);
        const payer = db.findOne('users', u => u.id === s.payer_id);
        const payee = db.findOne('users', u => u.id === s.payee_id);
        return {
          ...s,
          groupName: group ? group.name : 'Group',
          payerName: payer ? payer.name : 'Unknown',
          payeeName: payee ? payee.name : 'Unknown',
          isPayer: s.payer_id === userId
        };
      });

      enriched.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      return res.json({ success: true, count: enriched.length, data: enriched });
    } catch (err) {
      next(err);
    }
  }
};
