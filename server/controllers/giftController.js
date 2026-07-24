const { Gift, GiftTransaction } = require('../models/Gift');
const User = require('../models/User');
const { UserStats } = require('../models/Achievement');
const { Wallet, WalletTransaction } = require('../models/Wallet');
const Notification = require('../models/Notification');
const Message = require('../models/Message');

// Helper function to check achievements
const { checkAchievements } = require('./achievementController');

// @desc    Get all available gifts
// @route   GET /api/gifts
// @access  Private
exports.getGifts = async (req, res) => {
  try {
    const gifts = await Gift.find({ isActive: true }).sort({ category: 1, price: 1 });
    res.json(gifts);
  } catch (error) {
    console.error('Error fetching gifts:', error);
    res.status(500).json({ message: 'Failed to fetch gifts' });
  }
};

// @desc    Send a gift to a user
// @route   POST /api/gifts/send
// @access  Private
exports.sendGift = async (req, res) => {
  try {
    const { to, giftId, message, isAnonymous } = req.body;
    const sender = req.user._id;

    if (!to || !giftId) {
      return res.status(400).json({ message: 'Recipient and gift are required' });
    }

    if (to === sender.toString()) {
      return res.status(400).json({ message: 'Cannot send gift to yourself' });
    }

    const gift = await Gift.findById(giftId);
    if (!gift || !gift.isActive) {
      return res.status(404).json({ message: 'Gift not found' });
    }

    const recipient = await User.findById(to);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    // Check if recipient has opted out of receiving gifts
    if (recipient.giftingOptIn === false) {
      return res.status(400).json({ message: `${recipient.name} has opted out of receiving gifts.` });
    }

    // Check if user has enough wallet balance for paid gifts
    if (gift.price > 0) {
      let wallet = await Wallet.findOne({ user: sender });
      if (!wallet) {
        wallet = await Wallet.create({ user: sender });
      }
      if (wallet.balance < gift.price) {
        return res.status(400).json({ 
          message: 'Insufficient wallet balance',
          required: gift.price,
          available: wallet.balance
        });
      }
      
      // Deduct from wallet
      const balanceBefore = wallet.balance;
      wallet.balance -= gift.price;
      wallet.totalSpent += gift.price;
      await wallet.save();
    }

    // Create gift transaction
    const transaction = await GiftTransaction.create({
      from: sender,
      to,
      gift: giftId,
      message,
      isAnonymous
    });

    // Create wallet transaction record after gift transaction is created
    if (gift.price > 0) {
      let wallet = await Wallet.findOne({ user: sender });
      await WalletTransaction.create({
        wallet: wallet._id,
        user: sender,
        type: 'purchase',
        amount: gift.price,
        currency: gift.currency || 'LKR',
        description: `Gift sent: ${gift.name}`,
        relatedId: transaction._id,
        relatedType: 'gift',
        balanceBefore: wallet.balance + gift.price,
        balanceAfter: wallet.balance,
        status: 'completed'
      });
    }

    // Update user stats
    let userStats = await UserStats.findOne({ user: sender });
    if (!userStats) {
      userStats = new UserStats({ user: sender });
    }
    
    // Track daily gifts
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (userStats.lastGiftDate) {
      const lastGift = new Date(userStats.lastGiftDate);
      lastGift.setHours(0, 0, 0, 0);
      if (lastGift.getTime() !== today.getTime()) {
        userStats.dailyGiftsSent = 0; // Reset daily counter
      }
    }
    userStats.dailyGiftsSent = (userStats.dailyGiftsSent || 0) + 1;
    userStats.lastGiftDate = today;
    
    userStats.totalGiftsSent += 1;
    userStats.points += 5; // Bonus points for sending gift
    await userStats.save();

    // Check for gift-related achievements
    await checkAchievements(sender, userStats);

    // Update recipient stats and convert gift to points
    let recipientStats = await UserStats.findOne({ user: to });
    if (!recipientStats) {
      recipientStats = new UserStats({ user: to });
    }
    recipientStats.totalGiftsReceived += 1;
    
    // Convert received gift to reward points (10% of gift value or minimum 5 points)
    const pointsEarned = Math.max(5, Math.floor(gift.price * 0.1));
    recipientStats.points += pointsEarned;
    await recipientStats.save();

    console.log(`Gift received: User ${to} earned ${pointsEarned} points from gift ${gift.name}`);

    // Create notification with points earned info
    await Notification.create({
      user: to,
      type: 'gift',
      message: isAnonymous 
        ? `Someone sent you a gift! You earned ${pointsEarned} points!` 
        : `${req.user.name} sent you a gift! You earned ${pointsEarned} points!`,
      relatedUser: sender,
      relatedGift: transaction._id
    });

    // Create a message in chat so it appears in the conversation feed immediately
    const giftMsgContent = isAnonymous
      ? (message ? `🎁 Received an anonymous gift: ${gift.name} ${gift.emoji}\n"${message}"` : `🎁 Received an anonymous gift: ${gift.name} ${gift.emoji}`)
      : (message ? `🎁 Sent a gift: ${gift.name} ${gift.emoji}\n"${message}"` : `🎁 Sent a gift: ${gift.name} ${gift.emoji}`);

    await Message.create({
      from: sender,
      to: to,
      content: giftMsgContent,
      type: 'gift'
    });

    // Populate and return
    const populatedTransaction = await GiftTransaction.findById(transaction._id)
      .populate('gift')
      .populate('from', 'name profileImageUrl')
      .populate('to', 'name profileImageUrl');

    res.status(201).json(populatedTransaction);
  } catch (error) {
    console.error('Error sending gift:', error);
    res.status(500).json({ message: 'Failed to send gift' });
  }
};

// @desc    Get gift history for current user
// @route   GET /api/gifts/history
// @access  Private
exports.getGiftHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type = 'all' } = req.query;

    let query = {};
    if (type === 'sent') {
      query.from = userId;
    } else if (type === 'received') {
      query.to = userId;
    } else {
      query.$or = [{ from: userId }, { to: userId }];
    }

    const transactions = await GiftTransaction.find(query)
      .populate('gift')
      .populate('from', 'name profileImageUrl')
      .populate('to', 'name profileImageUrl')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(transactions);
  } catch (error) {
    console.error('Error fetching gift history:', error);
    res.status(500).json({ message: 'Failed to fetch gift history' });
  }
};

// @desc    Create a new gift (admin only)
// @route   POST /api/gifts/admin
// @access  Private/Admin
exports.createGift = async (req, res) => {
  try {
    console.log('Creating gift with data:', req.body);
    const gift = await Gift.create(req.body);
    res.status(201).json(gift);
  } catch (error) {
    console.error('Error creating gift:', error);
    res.status(500).json({ message: 'Failed to create gift', error: error.message });
  }
};

// @desc    Update a gift (admin only)
// @route   PUT /api/gifts/admin/:id
// @access  Private/Admin
exports.updateGift = async (req, res) => {
  try {
    console.log('Updating gift with id:', req.params.id, 'data:', req.body);
    const gift = await Gift.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!gift) {
      return res.status(404).json({ message: 'Gift not found' });
    }
    res.json(gift);
  } catch (error) {
    console.error('Error updating gift:', error);
    res.status(500).json({ message: 'Failed to update gift', error: error.message });
  }
};

// @desc    Delete a gift (admin only)
// @route   DELETE /api/gifts/admin/:id
// @access  Private/Admin
exports.deleteGift = async (req, res) => {
  try {
    const gift = await Gift.findByIdAndDelete(req.params.id);
    if (!gift) {
      return res.status(404).json({ message: 'Gift not found' });
    }
    res.json({ message: 'Gift deleted successfully' });
  } catch (error) {
    console.error('Error deleting gift:', error);
    res.status(500).json({ message: 'Failed to delete gift' });
  }
};
