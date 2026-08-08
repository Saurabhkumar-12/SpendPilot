import { db } from '../../db/database.js';
import { logAuditAction } from '../../middleware/auditLogger.js';

export const profileController = {
  async getProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const user = db.findOne('users', u => u.id === userId);
      if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

      const prefs = db.findOne('user_preferences', p => p.user_id === userId);

      return res.json({
        success: true,
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatar_url,
          isVerified: !!user.is_verified,
          createdAt: user.created_at,
          preferences: prefs || { currency: '₹', theme: 'dark', default_split_mode: 'EQUAL' }
        }
      });
    } catch (err) {
      next(err);
    }
  },

  async updateProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const { name } = req.body;

      if (name) {
        db.update('users', u => u.id === userId, {
          name: name.trim(),
          updated_at: new Date().toISOString()
        });
      }

      logAuditAction(userId, 'PROFILE_UPDATED', req);

      return res.json({ success: true, message: 'Profile updated successfully.' });
    } catch (err) {
      next(err);
    }
  },

  async uploadAvatar(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No image file uploaded.' });
      }

      const avatarPath = `/uploads/avatars/${req.file.filename}`;
      db.update('users', u => u.id === req.user.id, {
        avatar_url: avatarPath,
        updated_at: new Date().toISOString()
      });

      logAuditAction(req.user.id, 'AVATAR_UPLOADED', req, { avatarPath });

      return res.json({ success: true, message: 'Avatar updated successfully.', avatarUrl: avatarPath });
    } catch (err) {
      next(err);
    }
  },

  async updatePreferences(req, res, next) {
    try {
      const userId = req.user.id;
      const { currency, theme, defaultSplitMode, notifyInvites, notifySettlements } = req.body;

      const existing = db.findOne('user_preferences', p => p.user_id === userId);
      const updatedPref = {
        user_id: userId,
        currency: currency !== undefined ? currency : (existing ? existing.currency : '₹'),
        theme: theme !== undefined ? theme : (existing ? existing.theme : 'dark'),
        default_split_mode: defaultSplitMode !== undefined ? defaultSplitMode : (existing ? existing.default_split_mode : 'EQUAL'),
        notify_invites: notifyInvites !== undefined ? (notifyInvites ? 1 : 0) : (existing ? existing.notify_invites : 1),
        notify_settlements: notifySettlements !== undefined ? (notifySettlements ? 1 : 0) : (existing ? existing.notify_settlements : 1)
      };

      if (existing) {
        db.update('user_preferences', p => p.user_id === userId, updatedPref);
      } else {
        db.insert('user_preferences', updatedPref);
      }

      logAuditAction(userId, 'PREFERENCES_UPDATED', req);

      return res.json({ success: true, message: 'Preferences saved.', data: updatedPref });
    } catch (err) {
      next(err);
    }
  }
};
