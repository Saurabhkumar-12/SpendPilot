import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../../db/database.js';
import { config } from '../../config/index.js';
import { logAuditAction } from '../../middleware/auditLogger.js';
import { sendPasswordResetEmail, sendPasswordChangedConfirmationEmail, sendVerificationEmail } from '../../services/emailService.js';

export const authController = {
  // 1. User Registration
  async register(req, res, next) {
    try {
      const { name, email, password } = req.body;
      const normalizedEmail = email.toLowerCase().trim();

      const existingUser = db.findOne('users', u => u.email === normalizedEmail);
      if (existingUser) {
        return res.status(400).json({ success: false, error: 'An account with this email already exists.' });
      }

      const userId = crypto.randomUUID();
      const cleanPassword = password.trim();
      const passwordHash = await bcrypt.hash(cleanPassword, 10);
      const uniqueRecoveryPin = Math.floor(100000 + Math.random() * 900000).toString();

      const newUser = {
        id: userId,
        name: name.trim(),
        email: normalizedEmail,
        password_hash: passwordHash,
        recovery_pin: uniqueRecoveryPin,
        avatar_url: null,
        is_verified: 1, // Instant account verification
        verification_token: null,
        reset_token_expires: null,
        reset_token_hash: null,
        reset_token_used: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      db.insert('users', newUser);

      // Initialize User Preferences
      db.insert('user_preferences', {
        user_id: userId,
        currency: '₹',
        theme: 'light',
        default_split_mode: 'EQUAL',
        notify_invites: 1,
        notify_settlements: 1
      });

      // Initialize Auto-Login Session
      const sessionId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      db.insert('sessions', {
        id: sessionId,
        user_id: userId,
        token_hash: crypto.createHash('sha256').update(sessionId).digest('hex'),
        ip_address: req.ip || '127.0.0.1',
        user_agent: req.headers['user-agent'] || 'Unknown',
        created_at: new Date().toISOString(),
        expires_at: expiresAt,
        is_revoked: 0
      });

      // Sign JWT Tokens
      const token = jwt.sign(
        { userId: newUser.id, sessionId, email: newUser.email },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );

      const refreshToken = jwt.sign(
        { userId: newUser.id, sessionId },
        config.jwtRefreshSecret,
        { expiresIn: '30d' }
      );

      logAuditAction(userId, 'USER_REGISTERED_AND_LOGGED_IN', req, { email: normalizedEmail });

      sendVerificationEmail({
        to: newUser.email,
        userName: newUser.name,
        verificationToken: uniqueRecoveryPin
      }).catch(err => console.warn(`⚠️ [VERIFICATION EMAIL NOTICE]: ${err.message}`));

      return res.status(201).json({
        success: true,
        message: 'Account created successfully!',
        token,
        refreshToken,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          avatarUrl: newUser.avatar_url,
          isVerified: true,
          preferences: { currency: '₹', theme: 'light', defaultSplitMode: 'EQUAL' }
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // 2. Email Verification
  async verifyEmail(req, res, next) {
    try {
      return res.json({ success: true, message: 'Email address verified.' });
    } catch (err) {
      next(err);
    }
  },

  // 3. User Login
  async login(req, res, next) {
    try {
      const { email, password, rememberMe } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email and password are required.' });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const cleanPassword = password.trim();

      const user = db.findOne('users', u => u.email === normalizedEmail);
      if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid email or password.' });
      }

      // Handle users with empty password_hash safely without uncaught exception
      if (!user.password_hash || user.password_hash.trim() === '') {
        return res.status(401).json({ success: false, error: 'Invalid email or password.' });
      }

      // Test clean trimmed password first, then raw password as fallback
      let isPasswordValid = await bcrypt.compare(cleanPassword, user.password_hash).catch(() => false);
      if (!isPasswordValid && cleanPassword !== password) {
        isPasswordValid = await bcrypt.compare(password, user.password_hash).catch(() => false);
      }

      if (!isPasswordValid) {
        return res.status(401).json({ success: false, error: 'Invalid email or password.' });
      }

      const sessionId = crypto.randomUUID();
      const expiresInDays = rememberMe ? 30 : 1;
      const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();

      db.insert('sessions', {
        id: sessionId,
        user_id: user.id,
        token_hash: crypto.createHash('sha256').update(sessionId).digest('hex'),
        ip_address: req.ip || '127.0.0.1',
        user_agent: req.headers['user-agent'] || 'Unknown',
        created_at: new Date().toISOString(),
        expires_at: expiresAt,
        is_revoked: 0
      });

      const expiresInStr = rememberMe ? config.jwtRememberExpiresIn : config.jwtExpiresIn;
      const token = jwt.sign(
        { userId: user.id, sessionId, email: user.email },
        config.jwtSecret,
        { expiresIn: expiresInStr }
      );

      const refreshToken = jwt.sign(
        { userId: user.id, sessionId },
        config.jwtRefreshSecret,
        { expiresIn: '30d' }
      );

      const userPref = db.findOne('user_preferences', p => p.user_id === user.id);

      logAuditAction(user.id, 'USER_LOGIN', req, { rememberMe: !!rememberMe });

      return res.json({
        success: true,
        token,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatar_url,
          isVerified: true,
          preferences: userPref || { currency: '₹', theme: 'light', defaultSplitMode: 'EQUAL' }
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // 4. Token Refresh
  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ success: false, error: 'Refresh token is required.' });
      }

      const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret);
      const session = db.findOne('sessions', s =>
        s.id === decoded.sessionId &&
        s.user_id === decoded.userId &&
        Number(s.is_revoked) === 0 &&
        (!s.expires_at || new Date(s.expires_at) > new Date())
      );
      if (!session) {
        return res.status(401).json({ success: false, error: 'Session has been revoked or expired.' });
      }

      const user = db.findOne('users', u => u.id === decoded.userId);
      if (!user) {
        return res.status(401).json({ success: false, error: 'User account no longer exists.' });
      }

      const newToken = jwt.sign(
        { userId: user.id, sessionId: session.id, email: user.email },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );

      return res.json({ success: true, token: newToken });
    } catch (err) {
      return res.status(401).json({ success: false, error: 'Invalid or expired refresh token.' });
    }
  },

  // 5. Forgot Password Handler
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, error: 'Please enter your registered email address.' });
      }

      const normalizedEmail = String(email || '').trim().toLowerCase();
      const user = db.findOne('users', u => u.email && u.email.trim().toLowerCase() === normalizedEmail);

      const genericMessage = 'If an account exists for this email, password reset instructions have been sent.';

      if (!user) {
        logAuditAction(null, 'PASSWORD_RESET_FAILED', req, { email: normalizedEmail, reason: 'user_not_found' });
        return res.json({
          success: true,
          message: genericMessage
        });
      }

      const recipientEmail = user.email.trim().toLowerCase();
      console.log('[RESET EMAIL] Recipient:', recipientEmail);

      // Generate Cryptographic Raw Reset Token & Token Hash
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiryMinutes = config.passwordResetExpiryMinutes || 30;
      const resetTokenExpires = new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString();
      const idempotencyKey = `password-reset-${user.id}-${tokenHash}`;

      // Store ONLY token hash in database (NEVER rawToken)
      db.update('users', u => u.id === user.id, {
        reset_token_hash: tokenHash,
        reset_token_expires: resetTokenExpires,
        reset_token_used: false,
        updated_at: new Date().toISOString()
      });

      // Dispatch Email through provider using user.email from database record ONLY
      const mailResult = await sendPasswordResetEmail({
        to: recipientEmail,
        resetToken: rawToken,
        userName: user.name,
        idempotencyKey
      });

      logAuditAction(user.id, 'PASSWORD_RESET_REQUESTED', req, { email: recipientEmail });

      if (!mailResult.success) {
        db.update('users', u => u.id === user.id && u.reset_token_hash === tokenHash, {
          reset_token_hash: null,
          reset_token_expires: null,
          reset_token_used: false,
          updated_at: new Date().toISOString()
        });
        return res.status(500).json({
          success: false,
          error: 'Unable to send the reset email right now. Please try again later.'
        });
      }

      return res.json({
        success: true,
        message: genericMessage
      });
    } catch (err) {
      next(err);
    }
  },

  // 6. Verify Reset Token Handler
  async verifyResetToken(req, res, next) {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ success: false, message: 'Invalid password reset link.' });
      }

      const rawToken = token.trim();
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      const user = db.findOne('users', u => u.reset_token_hash === tokenHash);

      if (!user) {
        return res.status(400).json({ success: false, message: 'Invalid password reset link.' });
      }

      if (user.reset_token_used === true) {
        return res.status(400).json({ success: false, message: 'This password reset link has already been used.' });
      }

      if (user.reset_token_expires && new Date(user.reset_token_expires) < new Date()) {
        return res.status(400).json({ success: false, message: 'This password reset link has expired.' });
      }

      return res.json({ success: true, valid: true });
    } catch (err) {
      next(err);
    }
  },

  // 7. Reset Password Handler
  async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;

      if (!token) {
        return res.status(400).json({ success: false, error: 'Reset token is required.' });
      }

      if (!newPassword || newPassword.trim().length < 6) {
        return res.status(400).json({ success: false, error: 'New password must be at least 6 characters long.' });
      }

      const rawToken = token.trim();
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      const user = db.findOne('users', u => u.reset_token_hash === tokenHash);

      if (!user) {
        logAuditAction(null, 'PASSWORD_RESET_FAILED', req, { reason: 'invalid_token' });
        return res.status(400).json({ success: false, message: 'Invalid password reset link.' });
      }

      if (user.reset_token_used === true) {
        return res.status(400).json({ success: false, message: 'This password reset link has already been used.' });
      }

      if (user.reset_token_expires && new Date(user.reset_token_expires) < new Date()) {
        return res.status(400).json({ success: false, message: 'This password reset link has expired.' });
      }

      // Hash new password & INVALIDATE RESET TOKEN (Mark USED)
      const cleanNewPassword = newPassword.trim();
      const newHash = await bcrypt.hash(cleanNewPassword, 10);

      db.update('users', u => u.id === user.id, {
        password_hash: newHash,
        reset_token_hash: null,
        reset_token_expires: null,
        reset_token_used: true,
        updated_at: new Date().toISOString()
      });

      // Revoke all active user sessions for security
      db.update('sessions', s => s.user_id === user.id, { is_revoked: 1 });

      // Non-blocking confirmation email
      sendPasswordChangedConfirmationEmail({ to: user.email, userName: user.name }).catch(() => {});

      logAuditAction(user.id, 'PASSWORD_RESET_COMPLETED', req);

      return res.json({ success: true, message: 'Your password has been reset successfully.' });
    } catch (err) {
      next(err);
    }
  },

  // 7. Change Password
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      const user = db.findOne('users', u => u.id === userId);
      if (!user || !currentPassword || !newPassword) {
        return res.status(400).json({ success: false, error: 'Current and new passwords are required.' });
      }
      const cleanCurrent = currentPassword.trim();
      const cleanNew = newPassword.trim();

      let isValid = await bcrypt.compare(cleanCurrent, user.password_hash);
      if (!isValid) {
        isValid = await bcrypt.compare(currentPassword, user.password_hash);
      }

      if (!isValid) {
        return res.status(400).json({ success: false, error: 'Incorrect current password.' });
      }

      const newHash = await bcrypt.hash(cleanNew, 10);
      db.update('users', u => u.id === userId, {
        password_hash: newHash,
        updated_at: new Date().toISOString()
      });

      db.update('sessions', s => s.user_id === userId && s.id !== req.user.sessionId, { is_revoked: 1 });
      sendPasswordChangedConfirmationEmail({ to: user.email, userName: user.name }).catch(() => {});

      logAuditAction(userId, 'PASSWORD_CHANGED', req);

      return res.json({ success: true, message: 'Password updated successfully.' });
    } catch (err) {
      next(err);
    }
  },

  // Administrator-only recovery for users who have lost both password and recovery access.
  async adminResetPassword(req, res, next) {
    try {
      if (!config.adminEmail || req.user.email.toLowerCase() !== config.adminEmail) {
        return res.status(403).json({ success: false, error: 'Administrator access is required.' });
      }

      const normalizedEmail = req.body.email.trim().toLowerCase();
      const user = db.findOne('users', candidate => candidate.email?.trim().toLowerCase() === normalizedEmail);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User account not found.' });
      }

      const passwordHash = await bcrypt.hash(req.body.newPassword.trim(), 10);
      db.update('users', candidate => candidate.id === user.id, {
        password_hash: passwordHash,
        reset_token_hash: null,
        reset_token_expires: null,
        reset_token_used: true,
        updated_at: new Date().toISOString()
      });
      db.update('sessions', session => session.user_id === user.id, { is_revoked: 1 });
      logAuditAction(user.id, 'ADMIN_PASSWORD_RESET', req, { adminId: req.user.id });

      return res.json({ success: true, message: 'Password reset. The user must sign in again.' });
    } catch (err) {
      next(err);
    }
  },

  // 8. Logout
  async logout(req, res, next) {
    try {
      if (req.user.sessionId) {
        db.update('sessions', s => s.id === req.user.sessionId, { is_revoked: 1 });
      }
      logAuditAction(req.user.id, 'USER_LOGOUT', req);
      return res.json({ success: true, message: 'Logged out successfully.' });
    } catch (err) {
      next(err);
    }
  },

  // 9. Logout All Devices
  async logoutAllDevices(req, res, next) {
    try {
      db.update('sessions', s => s.user_id === req.user.id, { is_revoked: 1 });
      logAuditAction(req.user.id, 'USER_LOGOUT_ALL_DEVICES', req);
      return res.json({ success: true, message: 'All active sessions have been revoked across all devices.' });
    } catch (err) {
      next(err);
    }
  },

  // 10. Delete Account
  async deleteAccount(req, res, next) {
    try {
      const userId = req.user.id;

      // Revoke all sessions
      db.update('sessions', s => s.user_id === userId, { is_revoked: 1 });

      // Clean up user data safely preserving group integrity
      db.remove('group_members', m => m.user_id === userId);
      db.remove('user_preferences', p => p.user_id === userId);
      db.remove('personal_expenses', e => e.user_id === userId);
      db.remove('notifications', n => n.user_id === userId);
      db.remove('sessions', s => s.user_id === userId);
      db.remove('users', u => u.id === userId);

      logAuditAction(userId, 'ACCOUNT_DELETED', req);

      return res.json({ success: true, message: 'Your account and associated data have been permanently deleted.' });
    } catch (err) {
      next(err);
    }
  }
};
