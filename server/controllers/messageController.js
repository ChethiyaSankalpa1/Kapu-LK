const mongoose = require('mongoose');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Report = require('../models/Report');
const { encryptMessage, decryptMessage } = require('../utils/messageCrypto');
const cloudinary = require('../config/cloudinary');
const { logAuditEvent } = require('../middleware/auditLogger');
const { hasPremiumFeature } = require('../utils/entitlements');
const { containsRestrictedContactInfo } = require('../utils/contactDetector');

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { to, content, type, replyTo } = req.body;

    if (!to || !content) {
      return res.status(400).json({ message: 'Recipient and content are required' });
    }

    if (!mongoose.isValidObjectId(to)) {
      return res.status(400).json({ message: 'Invalid recipient ID' });
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

    // Contact restriction check: Normal/free and Bronze users cannot share phone numbers or email addresses in chat
    const canShareContactInfo = sender.role === 'admin' || hasPremiumFeature(sender, 'direct_contact_info');
    if (!canShareContactInfo) {
      const contactCheck = containsRestrictedContactInfo(content);
      if (contactCheck.hasRestrictedInfo) {
        return res.status(403).json({
          success: false,
          code: 'CONTACT_INFO_RESTRICTED',
          message: 'Sharing contact numbers is a Premium feature. Upgrade your plan to share contact details.',
        });
      }
    }

    const FREE_MESSAGE_LIMIT = 5;
    const MESSAGE_COOLDOWN_MS = 60 * 1000;
    const isAdminConversation = recipient.role === 'admin';
    const hasUnlimitedMessages = sender.role === 'admin' || hasPremiumFeature(sender, 'unlimited_messages');

    // Only apply cooldown for users without unlimited messages and non-admin conversations
    if (
      !hasUnlimitedMessages &&
      !isAdminConversation &&
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

    if (!hasUnlimitedMessages && !isAdminConversation && sender.messagesSent >= FREE_MESSAGE_LIMIT) {
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

    // Validate replyTo if provided
    let validatedReplyTo = null;
    if (replyTo && mongoose.isValidObjectId(replyTo)) {
      const targetMsg = await Message.findById(replyTo);
      if (targetMsg) {
        validatedReplyTo = targetMsg._id;
      }
    }

    const message = await Message.create({
      from: req.user._id,
      to,
      content: encryptedMessage.encryptedContent,
      contentIv: encryptedMessage.iv,
      type: type || 'text',
      replyTo: validatedReplyTo,
    });

    if (sender.role !== 'admin' && !isAdminConversation && !hasUnlimitedMessages) {
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
        createdAt: mongoose.trusted({ $gte: fiveMinutesAgo }),
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

    const populatedMsg = await Message.findById(message._id)
      .populate('from to', 'name profileImageUrl profileAvatar age location isOnline lastLogin')
      .populate({
        path: 'replyTo',
        select: 'content contentIv from type isDeletedForEveryone',
        populate: { path: 'from', select: 'name profileImageUrl profileAvatar' },
      });

    let decryptedReplyTo = null;
    if (populatedMsg && populatedMsg.replyTo) {
      let replyContent = '[Deleted message]';
      if (!populatedMsg.replyTo.isDeletedForEveryone) {
        try {
          replyContent = decryptMessage(populatedMsg.replyTo.content, populatedMsg.replyTo.contentIv);
        } catch (e) {
          replyContent = '[Encrypted message]';
        }
      }
      decryptedReplyTo = {
        ...populatedMsg.replyTo.toObject(),
        content: replyContent,
      };
    }

    const msgData = populatedMsg ? populatedMsg.toObject() : message.toObject();
    res.status(201).json({
      ...msgData,
      content,
      replyTo: decryptedReplyTo,
      senderIsPremium: sender.isPremium,
      messagesSent: sender.messagesSent,
      limit: FREE_MESSAGE_LIMIT,
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
      $and: [
        { $or: [{ from: userId }, { to: userId }] },
        { deletedFor: mongoose.trusted({ $ne: userId }) },
      ],
    })
      .sort({ createdAt: -1 })
      .populate('from to', 'name profileImageUrl profileAvatar age location isOnline lastLogin');

    const conversationsMap = new Map();

    messages.forEach((msg) => {
      if (!msg.from || !msg.to) return; // Skip invalid messages
      
      const fromId = msg.from._id || msg.from;
      const isFromUser = (fromId && typeof fromId.equals === 'function')
        ? fromId.equals(userId)
        : String(fromId) === String(userId);

      const otherUser = isFromUser ? msg.to : msg.from;
      if (!otherUser) return; // Skip if other user is null
      
      const otherUserId = otherUser._id || otherUser.id || otherUser;
      if (!otherUserId) return;
      const key = otherUserId.toString();
      
      let decryptedContent = '';
      if (msg.isDeletedForEveryone) {
        decryptedContent = 'This message was deleted';
      } else {
        try {
          decryptedContent = decryptMessage(msg.content, msg.contentIv);
        } catch (decryptError) {
          console.error('Message decryption error:', decryptError);
          decryptedContent = '[Encrypted message]';
        }
      }
      
      const normalizedMessage = {
        ...(typeof msg.toObject === 'function' ? msg.toObject() : msg),
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
      const toId = msg.to ? (msg.to._id || msg.to.id || msg.to) : null;
      const isToUser = toId && ((typeof toId.equals === 'function') ? toId.equals(userId) : String(toId) === String(userId));
      if (!msg.isRead && isToUser) {
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

    if (!otherUserId || !mongoose.isValidObjectId(otherUserId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const otherUser = await User.findById(otherUserId).select('_id name');
    if (!otherUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 200);
    const skip = Math.max(parseInt(req.query.skip, 10) || 0, 0);

    const messages = await Message.find({
      $and: [
        {
          $or: [
            { from: userId, to: otherUserId },
            { from: otherUserId, to: userId },
          ],
        },
        {
          deletedFor: mongoose.trusted({ $ne: userId }),
        },
      ],
    })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .populate('from to', 'name profileImageUrl isOnline lastLogin')
      .populate({
        path: 'replyTo',
        select: 'content contentIv from type isDeletedForEveryone',
        populate: { path: 'from', select: 'name profileImageUrl' },
      });

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
      let content = '[Encrypted message]';
      if (message.isDeletedForEveryone) {
        content = 'This message was deleted';
      } else {
        try {
          content = decryptMessage(message.content, message.contentIv);
        } catch (decryptError) {
          console.error('Decryption error for message:', message._id, decryptError);
        }
      }

      let replyToObj = null;
      if (message.replyTo) {
        let replyContent = '[Deleted message]';
        if (!message.replyTo.isDeletedForEveryone) {
          try {
            replyContent = decryptMessage(message.replyTo.content, message.replyTo.contentIv);
          } catch (e) {
            replyContent = '[Encrypted message]';
          }
        }
        replyToObj = {
          ...message.replyTo.toObject(),
          content: replyContent,
        };
      }

      return {
        ...message.toObject(),
        content,
        replyTo: replyToObj,
      };
    });

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

    if (!messageId || !mongoose.isValidObjectId(messageId)) {
      return res.status(400).json({ message: 'Invalid message ID' });
    }

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

    if (!messageId || !mongoose.isValidObjectId(messageId)) {
      return res.status(400).json({ message: 'Invalid message ID' });
    }

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

// @desc    Delete message for current user only ("Delete for Me")
// @route   DELETE /api/messages/:messageId/for-me
// @access  Private
exports.deleteForMe = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    if (!messageId || !mongoose.isValidObjectId(messageId)) {
      return res.status(400).json({ message: 'Invalid message ID' });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Must be either sender or recipient
    const isSender = message.from.equals(userId);
    const isRecipient = message.to.equals(userId);
    if (!isSender && !isRecipient) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    await Message.findByIdAndUpdate(messageId, {
      $addToSet: { deletedFor: userId },
    });

    res.json({
      success: true,
      message: 'Message deleted for you',
      messageId,
    });
  } catch (error) {
    console.error('Delete for me error:', error);
    res.status(500).json({ message: error.message || 'Failed to delete message' });
  }
};

// @desc    Delete message for everyone ("Delete for Everyone" - sender only within 60 minutes)
// @route   DELETE /api/messages/:messageId/for-everyone
// @access  Private
exports.deleteForEveryone = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    if (!messageId || !mongoose.isValidObjectId(messageId)) {
      return res.status(400).json({ message: 'Invalid message ID' });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only original sender can delete for everyone
    if (!message.from.equals(userId)) {
      return res.status(403).json({ message: 'Only the sender can delete a message for everyone' });
    }

    // 60-minute window check
    const WINDOW_MS = 60 * 60 * 1000;
    const messageAge = Date.now() - new Date(message.createdAt).getTime();
    if (messageAge > WINDOW_MS) {
      return res.status(400).json({
        message: 'Messages can only be deleted for everyone within 60 minutes of sending.',
      });
    }

    const encryptedPlaceholder = encryptMessage('This message was deleted');
    message.isDeletedForEveryone = true;
    message.deletedForEveryoneAt = new Date();
    message.content = encryptedPlaceholder.encryptedContent;
    message.contentIv = encryptedPlaceholder.iv;
    message.reactions = []; // Clear reactions on deleted message
    await message.save();

    res.json({
      success: true,
      message: 'Message deleted for everyone',
      messageId,
      content: 'This message was deleted',
      isDeletedForEveryone: true,
    });
  } catch (error) {
    console.error('Delete for everyone error:', error);
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

    if (!messageId || !mongoose.isValidObjectId(messageId)) {
      return res.status(400).json({ message: 'Invalid message ID' });
    }

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
