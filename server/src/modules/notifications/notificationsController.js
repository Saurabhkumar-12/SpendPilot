import { db } from '../../db/database.js';

export const notificationsController = {
  async getNotifications(req, res, next) {
    try {
      const userId = req.user.id;
      const notifications = db.find('notifications', n => n.user_id === userId);
      notifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const unreadCount = notifications.filter(n => n.is_read === 0).length;

      return res.json({ success: true, unreadCount, data: notifications });
    } catch (err) {
      next(err);
    }
  },

  async markAsRead(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      db.update('notifications', n => n.id === id && n.user_id === userId, { is_read: 1 });
      return res.json({ success: true, message: 'Notification marked as read.' });
    } catch (err) {
      next(err);
    }
  }
};
