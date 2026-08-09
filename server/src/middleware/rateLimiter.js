import rateLimit from 'express-rate-limit';

// Standardized 429 error handler creator
const createRateLimiter = (options) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      const retryAfterMinutes = Math.ceil(options.windowMs / (60 * 1000));
      return res.status(429).json({
        success: false,
        error: options.message || `Too many requests. Please try again in ${retryAfterMinutes} minutes.`,
        retryAfterMinutes,
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }
  });
};

// 1. Dedicated Login Limiter: 20 attempts per 15 minutes
export const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many failed login attempts. Please wait 15 minutes before trying again.'
});

// 2. Dedicated Register Limiter: 15 attempts per 1 hour
export const registerRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 15,
  message: 'Account creation limit reached. Please wait 1 hour before creating another account.'
});

// 3. Dedicated Forgot Password Limiter: Configurable (default 5 attempts per 15 minutes in prod, 50 in dev)
export const forgotPasswordRateLimiter = createRateLimiter({
  windowMs: parseInt(process.env.FORGOT_PASSWORD_WINDOW_MS || (15 * 60 * 1000).toString(), 10),
  max: parseInt(process.env.FORGOT_PASSWORD_RATE_LIMIT_MAX || (process.env.NODE_ENV === 'development' ? '50' : '5'), 10),
  message: 'Too many reset attempts. Please try again later.'
});

// 4. Dedicated Reset Password Limiter: 20 attempts per 1 hour
export const resetPasswordRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: 'Too many password reset attempts. Please wait 1 hour before trying again.'
});

// 5. General Auth Limiter: 100 requests per 15 minutes
export const generalAuthLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Authentication request rate limit exceeded. Please slow down.'
});

// 6. Authenticated API Limiter: 300 requests per 15 minutes
export const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: 'API request limit exceeded. Please try again in a few minutes.'
});
