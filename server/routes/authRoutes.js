const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  uploadProfileImage,
  verifyEmail,
  resendVerificationCode,
  changeVerificationEmail,
  fixInvalidEmail,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  setup2FA,
  verify2FA,
  disable2FA,
} = require('../controllers/authController');
const { protect, optionalProtect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');
const {
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  forgotPasswordLimiter,
  verifyResetCodeLimiter,
  verifyEmailLimiter,
  resendVerificationLimiter,
  changeVerificationEmailLimiter,
} = require('../middleware/rateLimiters');

router.post(
  '/register',
  registerLimiter,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('username').optional({ values: 'falsy' }).trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('phoneNumber').optional({ values: 'falsy' }).trim().if((value, { req }) => value).matches(/^[0-9]+$/).withMessage('Phone number must contain only numbers'),
    body('age').optional({ values: 'falsy' }).isInt({ min: 18, max: 100 }).withMessage('Age must be between 18 and 100'),
    body('gender').optional({ values: 'falsy' }).isIn(['male', 'female', 'other']).withMessage('Gender must be male, female, or other'),
    body('language').optional({ values: 'falsy' }).isIn(['en', 'si', 'ta']).withMessage('Language must be en, si, or ta'),
  ],
  validate,
  register
);

router.post(
  '/login',
  loginLimiter,
  [
    body('email').trim().notEmpty().withMessage('Email or username is required'),
    body('password').notEmpty().withMessage('Password is required'),
    body('twoFactorCode').optional().trim(),
  ],
  validate,
  login
);

router.post('/refresh', refreshToken);
router.post('/logout', logout);

// Email Verification
router.post(
  '/verify-email',
  optionalProtect,
  verifyEmailLimiter,
  [
    body('code').trim().matches(/^\d{6}$/).withMessage('Verification code must be exactly 6 digits'),
    body('email').optional().trim(),
  ],
  validate,
  verifyEmail
);

router.post(
  '/resend-verification-code',
  optionalProtect,
  resendVerificationLimiter,
  [
    body('email').optional().trim(),
  ],
  validate,
  resendVerificationCode
);

router.post(
  '/change-verification-email',
  optionalProtect,
  changeVerificationEmailLimiter,
  [
    body('newEmail').isEmail().withMessage('Valid new email is required').normalizeEmail(),
    body('oldEmail').optional().trim(),
  ],
  validate,
  changeVerificationEmail
);

router.post(
  '/fix-invalid-email',
  protect,
  resendVerificationLimiter,
  [
    body('newEmail').isEmail().withMessage('Valid new email is required').normalizeEmail(),
    body('password').optional(),
  ],
  validate,
  fixInvalidEmail
);

// Password Reset Flow: Forgot Password -> Receive Code -> Verify Code -> Reset Password
router.post(
  '/forgot-password',
  forgotPasswordLimiter,
  [body('email').trim().notEmpty().withMessage('Valid email is required')],
  validate,
  forgotPassword
);

router.post(
  '/verify-reset-code',
  verifyResetCodeLimiter,
  [
    body('email').trim().notEmpty().withMessage('Valid email is required'),
    body('code').trim().matches(/^\d{6}$/).withMessage('Verification code must be exactly 6 digits'),
  ],
  validate,
  verifyResetCode
);

router.post(
  '/reset-password',
  passwordResetLimiter,
  [
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('resetToken').optional().notEmpty().withMessage('Reset token is required'),
    body('token').optional().notEmpty().withMessage('Token is required'),
  ],
  validate,
  resetPassword
);

router.post(
  '/reset-password/:token',
  passwordResetLimiter,
  [
    param('token').notEmpty().withMessage('Reset token is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  resetPassword
);

router.get('/me', protect, getMe);
router.post('/upload-profile-image', protect, upload('profileImage'), uploadProfileImage);

// 2FA management routes
router.post('/2fa/setup', protect, setup2FA);
router.post(
  '/2fa/verify',
  protect,
  [body('code').notEmpty().withMessage('Verification code is required')],
  validate,
  verify2FA
);
router.post(
  '/2fa/disable',
  protect,
  [body('password').notEmpty().withMessage('Password is required to disable 2FA')],
  validate,
  disable2FA
);

module.exports = router;

