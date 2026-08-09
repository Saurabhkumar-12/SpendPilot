import express from 'express';
import { authController } from './authController.js';
import { authenticateToken } from '../../middleware/authGuard.js';
import { validateRequest } from '../../middleware/inputValidator.js';
import {
  registerRateLimiter,
  loginRateLimiter,
  forgotPasswordRateLimiter,
  resetPasswordRateLimiter
} from '../../middleware/rateLimiter.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyResetTokenSchema,
  resetPasswordSchema,
  changePasswordSchema
} from './authSchemas.js';

const router = express.Router();

// 1. Register Route (Dedicated register rate limiter: 5 attempts per 1 hour)
router.post('/register', registerRateLimiter, validateRequest(registerSchema), authController.register);

// 2. Login Route (Dedicated login rate limiter: 5 attempts per 15 minutes)
router.post('/login', loginRateLimiter, validateRequest(loginSchema), authController.login);

// 3. Token Refresh Route
router.post('/refresh-token', authController.refreshToken);

// 4. Verify Email Route
router.get('/verify-email', authController.verifyEmail);

// 5. Forgot Password Route
router.post('/forgot-password', forgotPasswordRateLimiter, validateRequest(forgotPasswordSchema), authController.forgotPassword);

// 6. Verify Reset Token Route
router.post('/verify-reset-token', resetPasswordRateLimiter, validateRequest(verifyResetTokenSchema), authController.verifyResetToken);

// 7. Reset Password Route
router.post('/reset-password', resetPasswordRateLimiter, validateRequest(resetPasswordSchema), authController.resetPassword);

// Authenticated Routes
router.post('/change-password', authenticateToken, validateRequest(changePasswordSchema), authController.changePassword);
router.post('/logout', authenticateToken, authController.logout);
router.post('/logout-all', authenticateToken, authController.logoutAllDevices);
router.delete('/account', authenticateToken, authController.deleteAccount);

// Independent Development Test Email Route
router.post('/dev/test-email', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email parameter is required.' });
    }
    const { sendPasswordResetEmail } = await import('../../services/emailService.js');
    const result = await sendPasswordResetEmail({ to: email.trim().toLowerCase(), resetToken: 'dev_test_token_123', userName: 'Test User' });
    return res.json({
      success: result.success,
      provider: result.provider || 'resend',
      messageId: result.messageId || null
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
