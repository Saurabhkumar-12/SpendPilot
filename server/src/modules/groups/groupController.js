import crypto from 'crypto';
import { db } from '../../db/database.js';
import { calculateOptimalSettlements } from '../../utils/settlementSolver.js';
import { logAuditAction } from '../../middleware/auditLogger.js';
import { emitGroupEvent } from '../../socket.js';

export const groupController = {
  async createGroup(req, res, next) {
    try {
      const userId = req.user.id;
      const { name, description, groupType } = req.body;

      const groupId = crypto.randomUUID();
      const newGroup = {
        id: groupId,
        name: name.trim(),
        description: description ? description.trim() : '',
        group_type: groupType || 'Friends',
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      db.insert('groups', newGroup);

      // Add creator as ADMIN member
      db.insert('group_members', {
        id: crypto.randomUUID(),
        group_id: groupId,
        user_id: userId,
        role: 'ADMIN',
        joined_at: new Date().toISOString()
      });

      logAuditAction(userId, 'GROUP_CREATED', req, { groupId, name });

      // Emit real-time group event
      emitGroupEvent(groupId, 'group:group-updated', {
        action: 'CREATED',
        group: newGroup,
        actorName: req.user.name
      }, userId);

      return res.status(201).json({ success: true, message: 'Group created successfully.', data: newGroup });
    } catch (err) {
      next(err);
    }
  },

  async getGroups(req, res, next) {
    try {
      const userId = req.user.id;

      // Find all groups user belongs to
      const memberRecords = db.find('group_members', m => m.user_id === userId);
      const groupIds = memberRecords.map(m => m.group_id);

      const groups = db.find('groups', g => groupIds.includes(g.id));

      // Populate summary stats per group
      const enrichedGroups = groups.map(g => {
        const members = db.find('group_members', m => m.group_id === g.id);
        const expenses = db.find('group_expenses', e => e.group_id === g.id);
        const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

        return {
          ...g,
          memberCount: members.length,
          totalExpenses: totalExpense,
          expenseCount: expenses.length
        };
      });

      return res.json({ success: true, count: enrichedGroups.length, data: enrichedGroups });
    } catch (err) {
      next(err);
    }
  },

  async getGroupDetails(req, res, next) {
    try {
      const userId = req.user.id;
      const { id: groupId } = req.params;

      const group = db.findOne('groups', g => g.id === groupId);
      if (!group) {
        return res.status(404).json({ success: false, error: 'Group not found.' });
      }

      // Verify user membership
      const userMembership = db.findOne('group_members', m => m.group_id === groupId && m.user_id === userId);
      if (!userMembership) {
        return res.status(403).json({ success: false, error: 'Access denied. You are not a member of this group.' });
      }

      // Fetch members with user details
      const memberRecords = db.find('group_members', m => m.group_id === groupId);
      const members = memberRecords.map(m => {
        const u = db.findOne('users', usr => usr.id === m.user_id);
        return {
          userId: m.user_id,
          role: m.role,
          userName: u ? u.name : 'Member',
          name: u ? u.name : 'Member',
          email: u ? u.email : '',
          avatarUrl: u ? u.avatar_url : null,
          joinedAt: m.joined_at
        };
      });

      // Fetch Expenses
      const expenses = db.find('group_expenses', e => e.group_id === groupId);
      const enrichedExpenses = expenses.map(e => {
        const payer = db.findOne('users', u => u.id === e.paid_by_id);
        const creator = db.findOne('users', u => u.id === e.created_by);
        const rawSplits = db.find('expense_splits', s => s.expense_id === e.id);
        
        const splits = rawSplits.map(s => {
          const splitUser = db.findOne('users', u => u.id === s.user_id);
          return {
            ...s,
            userName: splitUser ? splitUser.name : 'Member'
          };
        });

        return {
          ...e,
          paid_by_name: payer ? payer.name : 'Member',
          paidByName: payer ? payer.name : 'Member',
          createdByName: creator ? creator.name : 'Member',
          splits
        };
      });

      // Calculate member net balances for debt graph
      const balanceMap = {};
      members.forEach(m => { balanceMap[m.userId] = 0; });

      enrichedExpenses.forEach(e => {
        balanceMap[e.paid_by_id] = (balanceMap[e.paid_by_id] || 0) + Number(e.amount);
        e.splits.forEach(s => {
          balanceMap[s.user_id] = (balanceMap[s.user_id] || 0) - Number(s.amount_owed);
        });
      });

      // Adjust for completed settlements
      const settledTransactions = db.find('settlements', s => s.group_id === groupId && s.status === 'SETTLED');
      settledTransactions.forEach(s => {
        balanceMap[s.payer_id] = (balanceMap[s.payer_id] || 0) + Number(s.amount);
        balanceMap[s.payee_id] = (balanceMap[s.payee_id] || 0) - Number(s.amount);
      });

      const memberBalances = Object.entries(balanceMap).map(([uId, netBal]) => ({
        userId: uId,
        netBalance: netBal
      }));

      // Calculate min transactions settlement paths
      const rawSettlementPaths = calculateOptimalSettlements(memberBalances);
      const suggestedSettlements = rawSettlementPaths.map(s => {
        const payer = db.findOne('users', u => u.id === s.payerId);
        const payee = db.findOne('users', u => u.id === s.payeeId);
        return {
          payerId: s.payerId,
          payerName: payer ? payer.name : 'Member',
          fromName: payer ? payer.name : 'Member',
          payeeId: s.payeeId,
          payeeName: payee ? payee.name : 'Member',
          toName: payee ? payee.name : 'Member',
          amount: s.amount
        };
      });

      const userNetBalance = balanceMap[userId] || 0;

      return res.json({
        success: true,
        data: {
          group,
          userRole: userMembership.role,
          members,
          expenses: enrichedExpenses.sort((a, b) => new Date(b.date) - new Date(a.date)),
          userNetBalance,
          memberBalances,
          suggestedSettlements
        }
      });
    } catch (err) {
      next(err);
    }
  },

  async editGroup(req, res, next) {
    try {
      const userId = req.user.id;
      const { id: groupId } = req.params;
      const { name, description, groupType } = req.body;

      const membership = db.findOne('group_members', m => m.group_id === groupId && m.user_id === userId);
      if (!membership) {
        return res.status(403).json({ success: false, error: 'Access denied.' });
      }

      db.update('groups', g => g.id === groupId, {
        name: name ? name.trim() : undefined,
        description: description !== undefined ? description.trim() : undefined,
        group_type: groupType || undefined,
        updated_at: new Date().toISOString()
      });

      logAuditAction(userId, 'GROUP_UPDATED', req, { groupId });

      emitGroupEvent(groupId, 'group:group-updated', {
        action: 'UPDATED',
        groupId,
        name,
        actorName: req.user.name
      }, userId);

      return res.json({ success: true, message: 'Group updated successfully.' });
    } catch (err) {
      next(err);
    }
  },

  async deleteGroup(req, res, next) {
    try {
      const userId = req.user.id;
      const { id: groupId } = req.params;

      const group = db.findOne('groups', g => g.id === groupId);
      if (!group) return res.status(404).json({ success: false, error: 'Group not found.' });

      emitGroupEvent(groupId, 'group:group-updated', {
        action: 'DELETED',
        groupId,
        groupName: group.name,
        actorName: req.user.name
      }, userId);

      db.remove('groups', g => g.id === groupId);
      db.remove('group_members', m => m.group_id === groupId);
      db.remove('group_expenses', e => e.group_id === groupId);
      db.remove('settlements', s => s.group_id === groupId);

      logAuditAction(userId, 'GROUP_DELETED', req, { groupId });

      return res.json({ success: true, message: 'Group deleted successfully.' });
    } catch (err) {
      next(err);
    }
  },

  async inviteMember(req, res, next) {
    try {
      const userId = req.user.id;
      const { id: groupId } = req.params;
      const { name, email } = req.body;

      let targetUser = null;
      const memberName = name ? name.trim() : '';

      if (email && email.trim()) {
        const normEmail = email.toLowerCase().trim();
        targetUser = db.findOne('users', u => u.email === normEmail);
      }

      if (!targetUser && memberName) {
        targetUser = db.findOne('users', u => u.name.toLowerCase() === memberName.toLowerCase());
      }

      if (!targetUser) {
        const newUserId = crypto.randomUUID();
        const genEmail = email && email.trim() ? email.toLowerCase().trim() : `${memberName.toLowerCase().replace(/\s+/g, '')}_${Date.now().toString().slice(-4)}@group.local`;
        
        targetUser = {
          id: newUserId,
          name: memberName || 'Member',
          email: genEmail,
          password_hash: '',
          is_verified: 1,
          created_at: new Date().toISOString()
        };

        db.insert('users', targetUser);
      }

      const existingMember = db.findOne('group_members', m => m.group_id === groupId && m.user_id === targetUser.id);
      if (existingMember) {
        return res.status(400).json({ success: false, error: `${targetUser.name} is already a member of this group.` });
      }

      db.insert('group_members', {
        id: crypto.randomUUID(),
        group_id: groupId,
        user_id: targetUser.id,
        role: 'MEMBER',
        joined_at: new Date().toISOString()
      });

      emitGroupEvent(groupId, 'group:member-added', {
        member: {
          userId: targetUser.id,
          userName: targetUser.name,
          email: targetUser.email,
          role: 'MEMBER'
        },
        actorName: req.user.name
      }, userId);

      return res.json({ success: true, message: `${targetUser.name} added to the group!` });
    } catch (err) {
      next(err);
    }
  },

  async removeMember(req, res, next) {
    try {
      const { id: groupId, memberId } = req.params;
      const removedUser = db.findOne('users', u => u.id === memberId);
      
      db.remove('group_members', m => m.group_id === groupId && m.user_id === memberId);

      emitGroupEvent(groupId, 'group:member-removed', {
        memberId,
        memberName: removedUser ? removedUser.name : 'Member',
        actorName: req.user.name
      }, req.user.id);

      return res.json({ success: true, message: 'Member removed from group.' });
    } catch (err) {
      next(err);
    }
  },

  async addGroupExpense(req, res, next) {
    try {
      const userId = req.user.id;
      const { id: groupId } = req.params;
      const { amount, description, category, date, paidById, splitType, splits, notes } = req.body;

      const group = db.findOne('groups', g => g.id === groupId);
      if (!group) return res.status(404).json({ success: false, error: 'Group not found.' });

      const creatorMembership = db.findOne('group_members', m => m.group_id === groupId && m.user_id === userId);
      if (!creatorMembership) {
        return res.status(403).json({ success: false, error: 'Access denied. You are not a member of this group.' });
      }

      const totalAmount = Number(amount);
      if (isNaN(totalAmount) || totalAmount <= 0) {
        return res.status(400).json({ success: false, error: 'Expense amount must be greater than 0.' });
      }

      const totalPaise = Math.round(totalAmount * 100);

      const payerMember = db.findOne('group_members', m => m.group_id === groupId && m.user_id === paidById);
      if (!payerMember) {
        return res.status(400).json({ success: false, error: 'Selected payer is not a member of this group.' });
      }

      if (!Array.isArray(splits) || splits.length === 0) {
        return res.status(400).json({ success: false, error: 'At least one participating group member is required for the split.' });
      }

      const groupMemberRecords = db.find('group_members', m => m.group_id === groupId);
      const validGroupMemberIds = new Set(groupMemberRecords.map(m => m.user_id));

      for (const s of splits) {
        if (!validGroupMemberIds.has(s.userId)) {
          return res.status(400).json({ success: false, error: `Participant (ID: ${s.userId}) does not belong to this group.` });
        }
        if (Number(s.amountOwed) < 0) {
          return res.status(400).json({ success: false, error: 'Participant split amounts cannot be negative.' });
        }
      }

      let finalVerifiedSplits = [];

      if (splitType === 'PERCENTAGE') {
        const totalPct = splits.reduce((sum, s) => sum + (Number(s.percentage) || 0), 0);
        if (Math.abs(totalPct - 100) > 0.01) {
          if (totalPct > 100) {
            return res.status(400).json({ success: false, error: `Percentages cannot exceed 100%. Current total: ${totalPct.toFixed(1)}%` });
          }
          return res.status(400).json({ success: false, error: `Percentages must total 100%. Current total: ${totalPct.toFixed(1)}%` });
        }

        let assignedPaise = 0;
        finalVerifiedSplits = splits.map((s, idx) => {
          const pct = Number(s.percentage) || 0;
          let sharePaise = Math.round((totalPaise * pct) / 100);
          if (idx === splits.length - 1) {
            sharePaise = totalPaise - assignedPaise;
          } else {
            assignedPaise += sharePaise;
          }

          return {
            userId: s.userId,
            amountOwed: Math.round(sharePaise) / 100,
            percentage: pct
          };
        });
      } else if (splitType === 'EQUAL') {
        const participantCount = splits.length;
        const basePaise = Math.floor(totalPaise / participantCount);
        const remainderPaise = totalPaise % participantCount;

        finalVerifiedSplits = splits.map((s, idx) => {
          const sharePaise = basePaise + (idx < remainderPaise ? 1 : 0);
          return {
            userId: s.userId,
            amountOwed: Math.round(sharePaise) / 100,
            percentage: Math.round((100 / participantCount) * 100) / 100
          };
        });
      } else {
        const sumSplitsPaise = splits.reduce((sum, s) => sum + Math.round((Number(s.amountOwed) || 0) * 100), 0);

        if (sumSplitsPaise > totalPaise) {
          const diffAmt = ((sumSplitsPaise - totalPaise) / 100).toFixed(2);
          return res.status(400).json({ success: false, error: `Split amounts exceed the expense total by ₹${diffAmt}.` });
        }

        if (sumSplitsPaise < totalPaise) {
          const diffAmt = ((totalPaise - sumSplitsPaise) / 100).toFixed(2);
          return res.status(400).json({ success: false, error: `₹${diffAmt} remains to be assigned.` });
        }

        finalVerifiedSplits = splits.map(s => ({
          userId: s.userId,
          amountOwed: Math.round(Number(s.amountOwed) * 100) / 100,
          percentage: totalAmount > 0 ? Math.round(((Number(s.amountOwed) / totalAmount) * 100) * 100) / 100 : 0
        }));
      }

      const expenseId = crypto.randomUUID();
      const newExpense = {
        id: expenseId,
        group_id: groupId,
        description: description.trim(),
        amount: totalAmount,
        category: category || 'General',
        paid_by_id: paidById,
        created_by: userId,
        split_type: splitType,
        notes: notes ? notes.trim() : '',
        date: date || new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      };

      db.insert('group_expenses', newExpense);

      finalVerifiedSplits.forEach(s => {
        db.insert('expense_splits', {
          id: crypto.randomUUID(),
          expense_id: expenseId,
          user_id: s.userId,
          amount_owed: s.amountOwed,
          percentage: s.percentage || 0
        });
      });

      logAuditAction(userId, 'GROUP_EXPENSE_ADDED', req, { expenseId, groupId, amount: totalAmount });

      const payerUser = db.findOne('users', u => u.id === paidById);

      // Emit Real-Time Socket.IO event to all group members ONLY AFTER database commit
      emitGroupEvent(groupId, 'group:expense-created', {
        expense: {
          ...newExpense,
          paidByName: payerUser ? payerUser.name : 'Member',
          createdByName: req.user.name,
          splits: finalVerifiedSplits
        },
        actorName: req.user.name,
        groupName: group.name
      }, userId);

      return res.status(201).json({
        success: true,
        message: 'Group expense added successfully.',
        data: {
          ...newExpense,
          splits: finalVerifiedSplits
        }
      });
    } catch (err) {
      next(err);
    }
  },

  async editGroupExpense(req, res, next) {
    try {
      const userId = req.user.id;
      const { expenseId } = req.params;
      const { amount, description, category, date, paidById, splitType, splits, notes } = req.body;

      const existingExpense = db.findOne('group_expenses', e => e.id === expenseId);
      if (!existingExpense) {
        return res.status(404).json({ success: false, error: 'Expense not found.' });
      }

      const groupAdmin = db.findOne('group_members', m => m.group_id === existingExpense.group_id && m.user_id === userId && m.role === 'ADMIN');
      if (existingExpense.created_by !== userId && !groupAdmin) {
        return res.status(403).json({ success: false, error: 'Only the expense creator or group admin can modify this expense.' });
      }

      const totalAmount = Number(amount);
      if (isNaN(totalAmount) || totalAmount <= 0) {
        return res.status(400).json({ success: false, error: 'Expense amount must be greater than 0.' });
      }

      const totalPaise = Math.round(totalAmount * 100);
      const sumSplitsPaise = splits.reduce((sum, s) => sum + Math.round((Number(s.amountOwed) || 0) * 100), 0);

      if (splitType === 'EXACT' && sumSplitsPaise !== totalPaise) {
        const diff = Math.abs(sumSplitsPaise - totalPaise) / 100;
        if (sumSplitsPaise > totalPaise) {
          return res.status(400).json({ success: false, error: `Split amounts exceed the expense total by ₹${diff.toFixed(2)}.` });
        }
        return res.status(400).json({ success: false, error: `₹${diff.toFixed(2)} remains to be assigned.` });
      }

      db.update('group_expenses', e => e.id === expenseId, {
        description: description.trim(),
        amount: totalAmount,
        category: category || 'General',
        paid_by_id: paidById,
        split_type: splitType,
        notes: notes ? notes.trim() : '',
        date: date || existingExpense.date,
        updated_at: new Date().toISOString()
      });

      db.remove('expense_splits', s => s.expense_id === expenseId);
      splits.forEach(s => {
        db.insert('expense_splits', {
          id: crypto.randomUUID(),
          expense_id: expenseId,
          user_id: s.userId,
          amount_owed: Number(s.amountOwed),
          percentage: Number(s.percentage) || 0
        });
      });

      logAuditAction(userId, 'GROUP_EXPENSE_UPDATED', req, { expenseId });

      const payerUser = db.findOne('users', u => u.id === paidById);

      // Emit Real-Time Socket.IO Event
      emitGroupEvent(existingExpense.group_id, 'group:expense-updated', {
        expense: {
          id: expenseId,
          description: description.trim(),
          amount: totalAmount,
          paid_by_id: paidById,
          paidByName: payerUser ? payerUser.name : 'Member',
          split_type: splitType,
          splits
        },
        actorName: req.user.name
      }, userId);

      return res.json({ success: true, message: 'Expense updated successfully.' });
    } catch (err) {
      next(err);
    }
  },

  async deleteGroupExpense(req, res, next) {
    try {
      const userId = req.user.id;
      const { expenseId } = req.params;

      const existingExpense = db.findOne('group_expenses', e => e.id === expenseId);
      if (!existingExpense) {
        return res.status(404).json({ success: false, error: 'Expense not found.' });
      }

      const groupAdmin = db.findOne('group_members', m => m.group_id === existingExpense.group_id && m.user_id === userId && m.role === 'ADMIN');
      if (existingExpense.created_by !== userId && !groupAdmin) {
        return res.status(403).json({ success: false, error: 'Only the expense creator or group admin can delete this expense.' });
      }

      const groupId = existingExpense.group_id;

      db.remove('group_expenses', e => e.id === expenseId);
      db.remove('expense_splits', s => s.expense_id === expenseId);

      logAuditAction(userId, 'GROUP_EXPENSE_DELETED', req, { expenseId });

      // Emit Real-Time Socket.IO Event
      emitGroupEvent(groupId, 'group:expense-deleted', {
        expenseId,
        actorName: req.user.name
      }, userId);

      return res.json({ success: true, message: 'Expense deleted successfully.' });
    } catch (err) {
      next(err);
    }
  }
};
