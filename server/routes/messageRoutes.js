const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getConversations,
  getConversationWithUser,
  getMessageLimits,
  uploadChatImage,
  editMessage,
  deleteMessage,
  deleteForMe,
  deleteForEveryone,
  addReaction,
  reportMessage,
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { messageLimiter } = require('../middleware/rateLimiters');

router.get('/', protect, getConversations);
router.get('/limits', protect, getMessageLimits);
router.post('/upload', protect, upload('image'), uploadChatImage);
router.post('/report', protect, reportMessage);
router.get('/:userId', protect, getConversationWithUser);
router.post('/', protect, messageLimiter, sendMessage);
router.put('/:messageId', protect, editMessage);
router.delete('/:messageId', protect, deleteMessage);
router.delete('/:messageId/for-me', protect, deleteForMe);
router.delete('/:messageId/for-everyone', protect, deleteForEveryone);
router.post('/:messageId/reaction', protect, addReaction);

module.exports = router;

