import { config } from '../config/index.js';

export function errorHandler(err, req, res, next) {
  // Log detailed error stack internally on the server
  console.error(`❌ [SERVER ERROR] ${req.method} ${req.originalUrl}:`, err.stack || err.message || err);

  // Handle Rate Limiter Error
  if (err.status === 429 || err.code === 'RATE_LIMIT_EXCEEDED') {
    return res.status(429).json({
      success: false,
      error: err.message || 'Too many requests. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }

  // Handle Validation Errors
  if (err.name === 'ZodError') {
    const firstError = err.errors?.[0]?.message || 'Invalid input data provided.';
    return res.status(400).json({
      success: false,
      error: firstError,
      details: err.errors
    });
  }

  // Handle Security JWT Errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Authentication session invalid or expired. Please sign in again.'
    });
  }

  // General Friendly Response (No internal file paths or stack traces exposed)
  const statusCode = err.statusCode || err.status || 500;
  const userMessage = statusCode === 500 
    ? 'An unexpected system error occurred. Please try again later.'
    : (err.message || 'Request could not be processed.');

  return res.status(statusCode).json({
    success: false,
    error: userMessage
  });
}
