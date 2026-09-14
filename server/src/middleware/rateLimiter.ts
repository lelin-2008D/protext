import rateLimit from 'express-rate-limit';

// Rate limiter for general API requests
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests, please try again later.'
  }
});

// Stricter limiter for NLP parsing endpoint to prevent abuse
export const parseLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 parses per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Parsing rate limit exceeded. Please slow down.'
  }
});
