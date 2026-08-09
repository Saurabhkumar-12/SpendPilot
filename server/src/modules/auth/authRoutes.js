import express from 'express';
import { authController } from './authController.js';
import { authenticateToken } from '../../middleware/authGuard.js';
import { validateRequest } from '../../middleware/inputValidator.js';
import { registerRateLimiter, loginRateLimiter } from '../../middleware/rateLimiter.js';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  adminResetPasswordSchema
} from './authSchemas.js';

const router = express.Router();

// 1. Register Route (Dedicated register rate limiter: 5 attempts per 1 hour)
router.post('/register', registerRateLimiter, validateRequest(registerSchema), authController.register);

// 2. Login Route (Dedicated login rate limiter: 5 attempts per 15 minutes)
router.post('/login', loginRateLimiter, validateRequest(loginSchema), authController.login);

// 3. Token Refresh Route
router.post('/refresh-token', authController.refreshToken);

// Authenticated Routes
router.post('/change-password', authenticateToken, validateRequest(changePasswordSchema), authController.changePassword);
router.post('/admin/reset-password', authenticateToken, validateRequest(adminResetPasswordSchema), authController.adminResetPassword);
router.post('/logout', authenticateToken, authController.logout);
router.post('/logout-all', authenticateToken, authController.logoutAllDevices);
router.delete('/account', authenticateToken, authController.deleteAccount);

export default router;
