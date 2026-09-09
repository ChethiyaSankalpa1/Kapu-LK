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
  forgotPassword,
  resetPassword,
  setup2FA,
  verify2FA,
  disable2FA,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');
const {
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
} = require('../middleware/rateLimiters');

router.post(
  '/register',
  registerLimiter,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('username').optional({ values: 'falsy' }).trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('phoneNumber').optional({ values: 'falsy' }).matches(/^[0-9]+$/).withMessage('Phone number must contain only numbers'),
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
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
    body('twoFactorCode').optional().trim(),
  ],
  validate,
  login
);

router.post('/refresh', refreshToken);
router.post('/logout', logout);

router.post(
  '/forgot-password',
  passwordResetLimiter,
  [body('email').isEmail().withMessage('Valid email is required').normalizeEmail()],
  validate,
  forgotPassword
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

