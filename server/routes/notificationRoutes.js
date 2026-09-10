const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  adminMergeProfileViewDuplicates,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getNotifications);
router.put('/mark-all-read', protect, markAllAsRead);
router.put('/:id/read', protect, markAsRead);
router.post(
  '/admin/merge-profile-view-duplicates',
  protect,
  adminMergeProfileViewDuplicates
);

module.exports = router;
