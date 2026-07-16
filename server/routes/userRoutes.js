const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { 
  updateProfile, 
  getAllUsers, 
  getUserById, 
  searchUsers,
  getMatches,
  getAdminUser,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.put(
  '/profile',
  protect,
  [
    body('phoneNumber').optional().matches(/^[0-9]+$/).withMessage('Phone number must contain only numbers'),
    body('age').optional().isInt({ min: 18, max: 100 }).withMessage('Age must be between 18 and 100'),
    body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Gender must be male, female, or other'),
    body('language').optional().isIn(['en', 'si', 'ta']).withMessage('Language must be en, si, or ta'),
  ],
  validate,
  updateProfile
);
router.get('/', protect, getAllUsers);
router.get('/search', protect, searchUsers);
router.get('/matches', protect, getMatches);
router.get('/admin', protect, getAdminUser);
router.get('/:id', protect, getUserById);

module.exports = router;
