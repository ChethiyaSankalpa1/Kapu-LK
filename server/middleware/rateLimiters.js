const rateLimit = require('express-rate-limit');

// Key generator falling back safely
const getClientIp = (req) => {
  return req.headers['x-forwarded-for']
    ? req.headers['x-forwarded-for'].split(',')[0].trim()
    : req.ip || req.socket?.remoteAddress || 'unknown';
};

// Login limiter: 10 attempts per 15 mins per IP/account
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  keyGenerator: (req) => `${getClientIp(req)}_${req.body && req.body.email ? req.body.email.toLowerCase().trim() : ''}`,
  message: {
    success: false,
    message: 'Too many login attempts from this IP/account. Please try again after 15 minutes.',
  },
});

// Registration limiter: 10 registrations per hour per IP
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  keyGenerator: getClientIp,
  message: {
    success: false,
    message: 'Too many accounts created from this IP address. Please try again later.',
  },
});

// Password reset request limiter: 5 attempts per hour per IP
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  keyGenerator: getClientIp,
  message: {
    success: false,
    message: 'Too many password reset attempts. Please check your inbox or try again in an hour.',
  },
});

// Messaging limiter: 60 messages per minute
const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  keyGenerator: (req) => (req.user ? String(req.user._id) : getClientIp(req)),
  message: {
    success: false,
    message: 'Message rate limit exceeded. Please slow down.',
  },
});

// Payment submission limiter: 20 per hour
const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  keyGenerator: (req) => (req.user ? String(req.user._id) : getClientIp(req)),
  message: {
    success: false,
    message: 'Too many payment requests submitted. Please wait before submitting again.',
  },
});

// Support ticket limiter: 20 per hour
const supportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  keyGenerator: (req) => (req.user ? String(req.user._id) : getClientIp(req)),
  message: {
    success: false,
    message: 'Too many support requests submitted. Please wait before submitting again.',
  },
});

module.exports = {
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  messageLimiter,
  paymentLimiter,
  supportLimiter,
  apiLimiter: supportLimiter,
};