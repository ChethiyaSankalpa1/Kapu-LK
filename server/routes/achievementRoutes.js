const express = require('express');
const router = express.Router();
const {
  getAchievements,
  getMyStats,
  dailyCheckIn,
  createAchievement,
  updateAchievement,
  deleteAchievement
} = require('../controllers/achievementController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').get(protect, getAchievements);
router.route('/my-stats').get(protect, getMyStats);
router.route('/check-in').post(protect, dailyCheckIn);

// Admin routes
router.route('/admin').post(protect, admin, createAchievement);
router.route('/admin/:id').put(protect, admin, updateAchievement).delete(protect, admin, deleteAchievement);

module.exports = router;
