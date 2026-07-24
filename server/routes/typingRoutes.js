const express = require('express');
const router = express.Router();
const {
  setTyping,
  getTypingStatus
} = require('../controllers/typingController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').post(protect, setTyping);
router.route('/:userId').get(protect, getTypingStatus);

module.exports = router;
