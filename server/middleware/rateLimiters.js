const rateLimit = require('express-rate-limit');

// Key generator falling back safely
const getClientIp = (req) => {
  return req.headers['x-forwarded-for']
    ? req.headers['x-forwarded-for'].split(',')[0].trim()
    : req.ip || (req.socket && req.socket.remoteAddress) || 'unknown';
};

// Build a rate-limit key combining IP and optional normalized email (no trailing separators)
const keyWithOptionalEmail = (req) => {
  const ip = getClientIp(req);
  const rawEmail = req && req.body && typeof req.body.email === 'string' ? req.body.email : '';
  const normalizedEmail = rawEmail.toLowerCase().trim();
  return normalizedEmail ? `${ip}_${normalizedEmail}` : ip;
};

// Login limiter: 10 attempts per 15 mins per IP/account
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  keyGenerator: keyWithOptionalEmail,
  message: {
    success: false,
    message: 'Too many login attempts from this IP/account. Please try again after 15 minutes.',
  },
});

// Registration limiter: 50 registrations per hour per IP (increased for production)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
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

// Forgot password request limiter: 5 attempts per 15 mins by IP & email
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  keyGenerator: keyWithOptionalEmail,
  message: {
    success: false,
    message: 'Too many password reset requests. Please wait a few minutes before trying again.',
  },
});

// Verification code check limiter (OTP verification): 10 per 15 mins
const verifyResetCodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  keyGenerator: keyWithOptionalEmail,
  message: {
    success: false,
    message: 'Too many verification attempts. Please wait 15 minutes before trying again.',
  },
});

// Email verification check limiter: 10 per 15 mins
const verifyEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  keyGenerator: keyWithOptionalEmail,
  message: {
    success: false,
    message: 'Too many email verification attempts. Please wait 15 minutes.',
  },
});

// Resend verification code limiter: 10 per hour
const resendVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  keyGenerator: keyWithOptionalEmail,
  handler: (req, res, next, options) => {
    const retryAfter = Math.ceil(options.windowMs / 1000 / 60); // minutes
    res.status(429).json({
      success: false,
      message: 'Too many verification codes requested. Please wait before requesting another code.',
      retryAfter: options.windowMs / 1000, // seconds until window resets
      retryAfterMinutes: retryAfter,
    });
  },
});

// Change verification email limiter: 20 per hour (separate from resend code limiter)
const changeVerificationEmailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  keyGenerator: keyWithOptionalEmail,
  handler: (req, res, next, options) => {
    const retryAfter = Math.ceil(options.windowMs / 1000 / 60);
    res.status(429).json({
      success: false,
      message: 'Too many email change requests. Please wait before trying again.',
      retryAfter: options.windowMs / 1000,
      retryAfterMinutes: retryAfter,
    });
  },
});

module.exports = {
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  forgotPasswordLimiter,
  verifyResetCodeLimiter,
  verifyEmailLimiter,
  resendVerificationLimiter,
  changeVerificationEmailLimiter,
  messageLimiter,
  paymentLimiter,
  supportLimiter,
  apiLimiter: supportLimiter,
};