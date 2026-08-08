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

// 5. Forgot Password Route (DEDICATED forgotPasswordRateLimiter: 3 per 1 hour - NEVER shares login rate limiter!)
router.post('/forgot-password', forgotPasswordRateLimiter, validateRequest(forgotPasswordSchema), authController.forgotPassword);

// 6. Reset Password Route (Dedicated resetPasswordRateLimiter: 5 attempts per 1 hour)
router.post('/reset-password', resetPasswordRateLimiter, validateRequest(resetPasswordSchema), authController.resetPassword);

// Authenticated Routes
router.post('/change-password', authenticateToken, validateRequest(changePasswordSchema), authController.changePassword);
router.post('/logout', authenticateToken, authController.logout);
router.post('/logout-all', authenticateToken, authController.logoutAllDevices);
router.delete('/account', authenticateToken, authController.deleteAccount);

export default router;
