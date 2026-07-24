const TypingIndicator = require('../models/TypingIndicator');

// @desc    Set typing status
// @route   POST /api/typing
// @access  Private
exports.setTyping = async (req, res) => {
  try {
    const { conversationWith, isTyping } = req.body;
    const userId = req.user._id;

    if (!conversationWith) {
      return res.status(400).json({ message: 'Conversation user ID is required' });
    }

    if (isTyping) {
      // Set or update typing indicator
      await TypingIndicator.findOneAndUpdate(
        { user: userId, conversationWith },
        { user: userId, conversationWith, isTyping: true, lastUpdated: new Date() },
        { upsert: true, new: true }
      );
    } else {
      // Remove typing indicator
      await TypingIndicator.deleteOne({ user: userId, conversationWith });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error setting typing status:', error);
    res.status(500).json({ message: 'Failed to set typing status' });
  }
};

// @desc    Get typing status for a conversation
// @route   GET /api/typing/:userId
// @access  Private
exports.getTypingStatus = async (req, res) => {
  try {
    const { userId: conversationWith } = req.params;
    const currentUserId = req.user._id;

    // Check if the other user is typing
    const typingIndicator = await TypingIndicator.findOne({
      user: conversationWith,
      conversationWith: currentUserId,
      isTyping: true
    });

    res.json({ isTyping: !!typingIndicator });
  } catch (error) {
    console.error('Error getting typing status:', error);
    res.status(500).json({ message: 'Failed to get typing status' });
  }
};
