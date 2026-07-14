const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  uploadProfileImage,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/me', protect, getMe);
router.post('/upload-profile-image', protect, upload.single('profileImage'), uploadProfileImage);

module.exports = router;
