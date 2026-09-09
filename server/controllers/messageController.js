const Message = require('../models/Message');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Report = require('../models/Report');
const { encryptMessage, decryptMessage } = require('../utils/messageCrypto');
const cloudinary = require('../config/cloudinary');
const { logAuditEvent } = require('../middleware/auditLogger');

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { to, content, type } = req.body;

    if (!to || !content) {
      return res.status(400).json({ message: 'Recipient and content are required' });
    }

    if (typeof content !== 'string' || content.trim().length === 0 || content.length > 2000) {
      return res.status(400).json({ message: 'Message content must be between 1 and 2000 characters.' });
    }

    const sender = await User.findById(req.user._id);
    if (!sender) {
      return res.status(404).json({ message: 'Sender not found' });
    }

    const recipient = await User.findById(to);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    // Check if recipient has blocked sender or sender has blocked recipient
    if (recipient.blockedUsers && recipient.blockedUsers.some((id) => id.toString() === sender._id.toString())) {
      return res.status(403).json({ message: 'You cannot send messages to this user.' });
    }
    if (sender.blockedUsers && sender.blockedUsers.some((id) => id.toString() === recipient._id.toString())) {
      return res.status(400).json({ message: 'You have blocked this user. Unblock them first to send a message.' });
    }

    const FREE_MESSAGE_LIMIT = 5;
    const MESSAGE_COOLDOWN_MS = 60 * 1000;
    const isAdminConversation = recipient.role === 'admin';

    // Only apply cooldown for non-premium users and non-admin conversations
    if (
      sender.role !== 'admin' &&
      !isAdminConversation &&
      !sender.isPremium &&
      sender.lastMessageSentAt &&
      Date.now() - new Date(sender.lastMessageSentAt).getTime() < MESSAGE_COOLDOWN_MS
    ) {
      const secondsRemaining = Math.ceil(
        (MESSAGE_COOLDOWN_MS - (Date.now() - new Date(sender.lastMessageSentAt).getTime())) / 1000
      );
      return res.status(429).json({
        message: 'Please wait 1 minute before sending another message',
        secondsRemaining,
      });
    }

    // Reset daily message counter if it's a new calendar day
    const today = new Date();
    const lastSent = sender.lastMessageSentAt ? new Date(sender.lastMessageSentAt) : null;
    let isNewDay = false;
    if (!lastSent) {
      isNewDay = true;
    } else {
      const todayDateStr = today.toDateString();
      const lastSentDateStr = lastSent.toDateString();
      if (todayDateStr !== lastSentDateStr) {
        isNewDay = true;
      }
    }

    if (isNewDay) {
      sender.messagesSent = 0;
      await sender.save();
    }

    if (sender.role !== 'admin' && !isAdminConversation && !sender.isPremium && sender.messagesSent >= FREE_MESSAGE_LIMIT) {
      return res.status(403).json({
        message: 'Free message limit reached',
        limit: FREE_MESSAGE_LIMIT,
        sent: sender.messagesSent,
      });
    }

    let encryptedMessage;
    try {
      encryptedMessage = encryptMessage(content);
    } catch (encryptError) {
      console.error('Message encryption error:', encryptError);
      return res.status(500).json({ message: 'Failed to encrypt message' });
    }

    const message = await Message.create({
      from: req.user._id,
      to,
      content: encryptedMessage.encryptedContent,
      contentIv: encryptedMessage.iv,
      type: type || 'text',
    });

    if (sender.role !== 'admin' && !isAdminConversation && !sender.isPremium) {
      sender.messagesSent += 1;
    }
    sender.lastMessageSentAt = new Date();
    await sender.save();

    // Check if a similar notification already exists in the last 5 minutes
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const existingNotification = await Notification.findOne({
        user: to,
        type: 'message',
        relatedUser: req.user._id,
        createdAt: { $gte: fiveMinutesAgo }
      });

      if (!existingNotification) {
        await Notification.create({
          user: to,
          type: 'message',
          message: `New message from ${sender.name}`,
          relatedUser: req.user._id,
        });
      }
    } catch (notificationError) {
      console.error('Notification creation error (non-critical):', notificationError);
      // Don't fail the message send if notification fails
    }

    res.status(201).json({
      ...message.toObject(),
      content,
      senderIsPremium: sender.isPremium,
      messagesSent: sender.messagesSent,
      limit: FREE_MESSAGE_LIMIT
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: error.message || 'Failed to send message' });
  }
};

// @desc    Get message conversations (inbox)
// @route   GET /api/messages
// @access  Private
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const messages = await Message.find({
      $or: [{ from: userId }, { to: userId }],
    })
      .sort({ createdAt: -1 })
      .populate('from to', 'name profileImageUrl age location isOnline lastLogin');

    const conversationsMap = new Map();

    messages.forEach((msg) => {
      if (!msg.from || !msg.to) return; // Skip invalid messages
      
      const otherUser = msg.from._id.equals(userId) ? msg.to : msg.from;
      if (!otherUser) return; // Skip if other user is null
      
      const key = otherUser._id.toString();
      
      let decryptedContent = '';
      try {
        decryptedContent = decryptMessage(msg.content, msg.contentIv);
      } catch (decryptError) {
        console.error('Message decryption error:', decryptError);
        decryptedContent = '[Encrypted message]';
      }
      
      const normalizedMessage = {
        ...msg.toObject(),
        content: decryptedContent,
      };

      if (!conversationsMap.has(key)) {
        conversationsMap.set(key, {
          user: otherUser,
          lastMessage: normalizedMessage,
          unreadCount: 0,
        });
      }

      const convo = conversationsMap.get(key);
      if (!msg.isRead && msg.to._id && msg.to._id.equals(userId)) {
        convo.unreadCount += 1;
      }
    });

    res.json(Array.from(conversationsMap.values()));
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Failed to fetch conversations' });
  }
};

// @desc    Get messages with a specific user
// @route   GET /api/messages/:userId
// @access  Private
exports.getConversationWithUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const otherUserId = req.params.userId;

    console.log('Fetching conversation between:', userId, 'and', otherUserId);

    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 200);
    const skip = Math.max(parseInt(req.query.skip, 10) || 0, 0);

    const messages = await Message.find({
      $or: [
        { from: userId, to: otherUserId },
        { from: otherUserId, to: userId },
      ],
    })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .populate('from to', 'name profileImageUrl isOnline lastLogin');

    console.log('Found messages count:', messages.length);

    await Message.updateMany(
      { from: otherUserId, to: userId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    await Notification.updateMany(
      {
        user: userId,
        type: 'message',
        relatedUser: otherUserId,
        isRead: false,
      },
      { $set: { isRead: true } }
    );

    const normalizedMessages = messages.map((message) => {
      try {
        return {
          ...message.toObject(),
          content: decryptMessage(message.content, message.contentIv),
        };
      } catch (decryptError) {
        console.error('Decryption error for message:', message._id, decryptError);
        return {
          ...message.toObject(),
          content: '[Encrypted message]',
        };
      }
    });

    console.log('Returning messages count:', normalizedMessages.length);
    res.json(normalizedMessages);
  } catch (error) {
    console.error('Error in getConversationWithUser:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload chat image to Cloudinary
// @route   POST /api/messages/upload
// @access  Private
exports.uploadChatImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an image' });
    }

    // Convert buffer to base64
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'matrimonial_chats',
      resource_type: 'auto',
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' },
        { quality: 'auto' },
      ],
    });

    res.json({
      message: 'Chat image uploaded successfully',
      imageUrl: result.secure_url,
    });
  } catch (error) {
    console.error('Chat image upload error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Edit a message
// @route   PUT /api/messages/:messageId
// @access  Private
exports.editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Content is required' });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is the sender
    if (!message.from.equals(req.user._id)) {
      return res.status(403).json({ message: 'You can only edit your own messages' });
    }

    // Encrypt the new content
    let encryptedMessage;
    try {
      encryptedMessage = encryptMessage(content);
    } catch (encryptError) {
      console.error('Message encryption error:', encryptError);
      return res.status(500).json({ message: 'Failed to encrypt message' });
    }

    // Update the message
    message.content = encryptedMessage.encryptedContent;
    message.contentIv = encryptedMessage.iv;
    message.edited = true;
    message.editedAt = new Date();
    await message.save();

    res.json({
      ...message.toObject(),
      content,
    });
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({ message: error.message || 'Failed to edit message' });
  }
};

// @desc    Delete a message
// @route   DELETE /api/messages/:messageId
// @access  Private
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is the sender
    if (!message.from.equals(req.user._id)) {
      return res.status(403).json({ message: 'You can only delete your own messages' });
    }

    // Mark as deleted instead of actually deleting
    message.deleted = true;
    message.deletedAt = new Date();
    message.content = encryptMessage('This message was deleted.').encryptedContent;
    message.contentIv = encryptMessage('This message was deleted.').iv;
    await message.save();

    res.json({
      message: 'Message deleted successfully',
      deleted: true,
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: error.message || 'Failed to delete message' });
  }
};

// @desc    Add reaction to a message
// @route   POST /api/messages/:messageId/reaction
// @access  Private
exports.addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    if (!emoji) {
      return res.status(400).json({ message: 'Emoji is required' });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Access control: Only conversation participants can react to messages
    if (message.from.toString() !== userId.toString() && message.to.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to react to this message' });
    }

    // Check if user already reacted with this emoji
    const existingReactionIndex = message.reactions.findIndex(
      r => r.user.toString() === userId.toString() && r.emoji === emoji
    );

    if (existingReactionIndex !== -1) {
      // Remove the reaction (toggle off)
      message.reactions.splice(existingReactionIndex, 1);
    } else {
      // Remove any existing reaction by this user (only one reaction per user)
      message.reactions = message.reactions.filter(
        r => r.user.toString() !== userId.toString()
      );
      // Add new reaction
      message.reactions.push({ user: userId, emoji });
    }

    await message.save();

    // Populate reactions for response
    const updatedMessage = await Message.findById(messageId)
      .populate('reactions.user', 'name profileImageUrl');

    res.json(updatedMessage);
  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({ message: error.message || 'Failed to add reaction' });
  }
};

// @desc    Report an abusive user or message
// @route   POST /api/messages/report
// @access  Private
exports.reportMessage = async (req, res) => {
  try {
    const { reportedUserId, reason, details } = req.body;
    if (!reportedUserId || !reason) {
      return res.status(400).json({ message: 'Reported user ID and reason are required' });
    }

    const report = await Report.create({
      reporter: req.user._id,
      reportedUser: reportedUserId,
      reason: String(reason).slice(0, 200),
      details: details ? String(details).slice(0, 1000) : '',
    });

    logAuditEvent({
      userId: req.user._id,
      action: 'USER_REPORTED',
      targetId: reportedUserId,
      targetType: 'User',
      details: { reason },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully. Administrators will review this case.',
      reportId: report._id,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to submit report' });
  }
};
