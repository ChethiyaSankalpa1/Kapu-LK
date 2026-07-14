const express = require('express');
const router = express.Router();
const { 
  updateProfile, 
  getAllUsers, 
  getUserById, 
  searchUsers,
  getMatches,
  getAdminUser,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.put('/profile', protect, updateProfile);
router.get('/', protect, getAllUsers);
router.get('/search', protect, searchUsers);
router.get('/matches', protect, getMatches);
router.get('/admin', protect, getAdminUser);
router.get('/:id', protect, getUserById);

module.exports = router;
