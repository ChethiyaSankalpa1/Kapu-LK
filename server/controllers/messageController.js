const Message = require('../models/Message');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { encryptMessage, decryptMessage } = require('../utils/messageCrypto');
const cloudinary = require('../config/cloudinary');

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { to, content, type } = req.body;

    if (!to || !content) {
      return res.status(400).json({ message: 'Recipient and content are required' });
    }

    const sender = await User.findById(req.user._id);
    if (!sender) {
      return res.status(404).json({ message: 'Sender not found' });
    }

    const recipient = await User.findById(to);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
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

    const encryptedMessage = encryptMessage(content);

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
        message: `New message from ${req.user.name}`,
        relatedUser: req.user._id,
      });
    }

    res.status(201).json({
      ...message.toObject(),
      content,
      senderIsPremium: sender.isPremium,
      messagesSent: sender.messagesSent,
      limit: FREE_MESSAGE_LIMIT
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
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

    const messages = await Message.find({
      $or: [
        { from: userId, to: otherUserId },
        { from: otherUserId, to: userId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate('from to', 'name profileImageUrl isOnline lastLogin');

    await Message.updateMany(
      { from: otherUserId, to: userId, isRead: false },
      { $set: { isRead: true } }
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

    const normalizedMessages = messages.map((message) => ({
      ...message.toObject(),
      content: decryptMessage(message.content, message.contentIv),
    }));

    res.json(normalizedMessages);
  } catch (error) {
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
