const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getConversations,
  getConversationWithUser,
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getConversations);
router.get('/:userId', protect, getConversationWithUser);
router.post('/', protect, sendMessage);

module.exports = router;
