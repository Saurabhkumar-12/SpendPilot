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

// 1. Dedicated Login Limiter: 5 attempts per 15 minutes
export const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many failed login attempts. Please wait 15 minutes before trying again.'
});

// 2. Dedicated Register Limiter: 5 attempts per 1 hour
export const registerRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Account creation limit reached. Please wait 1 hour before creating another account.'
});

// 3. Dedicated Forgot Password Limiter: 3 requests per 1 hour
export const forgotPasswordRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Too many password reset requests. For security reasons, please wait 1 hour before requesting another reset email.'
});

// 4. Dedicated Reset Password Limiter: 5 attempts per 1 hour
export const resetPasswordRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
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
