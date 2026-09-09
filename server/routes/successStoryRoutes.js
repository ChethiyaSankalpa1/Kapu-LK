const express = require('express');
const router = express.Router();
const {
  getSuccessStories,
  getSuccessStory,
  createSuccessStory,
  likeSuccessStory,
  approveSuccessStory,
  featureSuccessStory,
  deleteSuccessStory,
  updateSuccessStory
} = require('../controllers/successStoryController');
const { protect, admin } = require('../middleware/auth');

router.route('/').get(getSuccessStories).post(protect, createSuccessStory);
router.route('/:id').get(getSuccessStory).put(protect, admin, updateSuccessStory);
router.route('/:id/like').post(protect, likeSuccessStory);
router.route('/:id/approve').put(protect, admin, approveSuccessStory);
router.route('/:id/feature').put(protect, admin, featureSuccessStory);
router.route('/:id').delete(protect, admin, deleteSuccessStory);

module.exports = router;
