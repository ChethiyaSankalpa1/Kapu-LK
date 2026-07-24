const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getConversations,
  getConversationWithUser,
  uploadChatImage,
  editMessage,
  deleteMessage,
  addReaction,
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', protect, getConversations);
router.post('/upload', protect, upload.single('image'), uploadChatImage);
router.get('/:userId', protect, getConversationWithUser);
router.post('/', protect, sendMessage);
router.put('/:messageId', protect, editMessage);
router.delete('/:messageId', protect, deleteMessage);
router.post('/:messageId/reaction', protect, addReaction);

module.exports = router;
