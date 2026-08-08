import crypto from 'crypto';
import { db } from '../../db/database.js';
import { logAuditAction } from '../../middleware/auditLogger.js';

export const feedbackController = {
  async getFeedback(req, res, next) {
    try {
      const feedbackList = db.find('feedback');
      feedbackList.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return res.json({ success: true, count: feedbackList.length, data: feedbackList });
    } catch (err) {
      next(err);
    }
  },

  async submitFeedback(req, res, next) {
    try {
      const { name, role, rating, message } = req.body;

      const newFeedback = {
        id: crypto.randomUUID(),
        name: name.trim(),
        role: role ? role.trim() : 'User',
        rating: Number(rating) || 5,
        message: message.trim(),
        created_at: new Date().toISOString()
      };

      db.insert('feedback', newFeedback);
      logAuditAction(req.user ? req.user.id : 'ANONYMOUS', 'FEEDBACK_SUBMITTED', req, { name, rating });

      return res.status(201).json({ success: true, message: 'Thank you for your feedback! It has been posted.', data: newFeedback });
    } catch (err) {
      next(err);
    }
  }
};
