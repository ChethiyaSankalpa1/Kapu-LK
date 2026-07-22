const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getConversations,
  getConversationWithUser,
  uploadChatImage,
  editMessage,
  deleteMessage,
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', protect, getConversations);
router.post('/upload', protect, upload.single('image'), uploadChatImage);
router.get('/:userId', protect, getConversationWithUser);
router.post('/', protect, sendMessage);
router.put('/:messageId', protect, editMessage);
router.delete('/:messageId', protect, deleteMessage);

module.exports = router;
