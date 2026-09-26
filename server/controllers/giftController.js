const mongoose = require('mongoose');
const { Gift, GiftTransaction } = require('../models/Gift');
const User = require('../models/User');
const { UserStats } = require('../models/Achievement');
const { Wallet, WalletTransaction } = require('../models/Wallet');
const PremiumPlan = require('../models/PremiumPlan');
const PremiumGiftTransaction = require('../models/PremiumGiftTransaction');
const Notification = require('../models/Notification');
const Message = require('../models/Message');

// Helper function to check achievements
const { checkAchievements } = require('./achievementController');

// @desc    Get all available gifts
// @route   GET /api/gifts
// @access  Private
exports.getGifts = async (req, res) => {
  try {
    let gifts = await Gift.find({ isActive: true, isPremium: { $ne: true }, name: { $not: /premium/i } }).sort({ category: 1, price: 1 });
    if (!gifts || gifts.length === 0) {
      // Seed default gifts if database is empty
      const defaultGifts = [
        { name: 'Red Rose', emoji: '🌹', category: 'flowers', price: 50, isRecommended: true },
        { name: 'Love Heart', emoji: '❤️', category: 'hearts', price: 100, isRecommended: true },
        { name: 'Coffee Cup', emoji: '☕', category: 'drinks', price: 150 },
        { name: 'Box of Chocolates', emoji: '🍫', category: 'food', price: 200 },
        { name: 'Special Gift Box', emoji: '🎁', category: 'gifts', price: 300 },
        { name: '1-Month Premium Pass', emoji: '👑', category: 'special', price: 500, isPremium: true, description: 'Grants 30 days Premium membership to recipient!' }
      ];
      gifts = await Gift.insertMany(defaultGifts);
    }
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
    if (gift.isPremium || /premium/i.test(gift.name)) {
      return res.status(400).json({ message: 'Choose a Bronze, Silver, or Gold plan to gift Premium.' });
    }

    const recipient = await User.findById(to);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    // Check if recipient has opted out of receiving gifts
    if (recipient.giftingOptIn === false) {
      return res.status(400).json({ message: `${recipient.name} has opted out of receiving gifts.` });
    }

    let walletBefore = 0;
    let walletAfter = 0;

    // Secure payment atomically BEFORE granting any benefits
    if (gift.price > 0) {
      const updatedWallet = await Wallet.findOneAndUpdate(
        { user: sender, balance: mongoose.trusted({ $gte: gift.price }) },
        { $inc: { balance: -gift.price, totalSpent: gift.price } },
        { new: true }
      );

      if (!updatedWallet) {
        const wallet = await Wallet.findOne({ user: sender });
        const available = wallet ? wallet.balance : 0;
        return res.status(400).json({
          message: 'Insufficient wallet balance',
          required: gift.price,
          available,
        });
      }

      walletAfter = updatedWallet.balance;
      walletBefore = updatedWallet.balance + gift.price;
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
      type: 'gift_received',
      message: isAnonymous 
        ? `Someone sent you a gift (${gift.name} ${gift.emoji})! You earned ${pointsEarned} points!` 
        : `${req.user.name} sent you a gift (${gift.name} ${gift.emoji})! You earned ${pointsEarned} points!`,
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

// @desc    Gift a selected Premium plan using the sender's wallet
// @route   POST /api/gifts/premium
// @access  Private
exports.sendPremiumGift = async (req, res) => {
  const { to, planBadge, idempotencyKey } = req.body;
  const senderId = req.user._id;
  const allowedBadges = ['bronze', 'silver', 'gold'];

  if (!to || !allowedBadges.includes(planBadge) || typeof idempotencyKey !== 'string' || !idempotencyKey.trim() || idempotencyKey.length > 100) {
    return res.status(400).json({ message: 'Recipient, Premium plan, and payment request key are required.' });
  }
  if (!mongoose.isValidObjectId(to)) {
    return res.status(400).json({ message: 'Invalid recipient.' });
  }
  if (String(to) === String(senderId)) {
    return res.status(400).json({ message: 'Cannot gift Premium to yourself.' });
  }

  const requestKey = idempotencyKey.trim();
  const findExisting = () => PremiumGiftTransaction.findOne({ sender: senderId, idempotencyKey: requestKey })
    .populate('sender', 'name username profileImageUrl profileAvatar')
    .populate('recipient', 'name username profileImageUrl profileAvatar')
    .populate('plan', 'name badge price currency durationDays');
  const existing = await findExisting();
  if (existing) {
    if (String(existing.recipient?._id || existing.recipient) !== String(to) || existing.planBadge !== planBadge) {
      return res.status(409).json({ message: 'This payment request key was already used for another gift.' });
    }
    return res.status(200).json(existing);
  }

  const session = await mongoose.startSession();
  let giftTransactionId;
  try {
    await session.withTransaction(async () => {
      const plan = await PremiumPlan.findOne({ badge: planBadge, isActive: true }).session(session);
      if (!plan) {
        const error = new Error('Selected Premium plan is unavailable.');
        error.statusCode = 404;
        throw error;
      }

      const recipient = await User.findById(to).session(session);
      if (!recipient) {
        const error = new Error('Recipient not found.');
        error.statusCode = 404;
        throw error;
      }
      if (recipient.giftingOptIn === false) {
        const error = new Error(`${recipient.name} has opted out of receiving gifts.`);
        error.statusCode = 400;
        throw error;
      }

      const now = new Date();
      const currentExpiry = recipient.premiumExpiresAt && recipient.premiumExpiresAt > now
        ? recipient.premiumExpiresAt
        : now;
      const expiresAt = new Date(currentExpiry.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
      const [giftTransaction] = await PremiumGiftTransaction.create([{
        sender: senderId,
        recipient: recipient._id,
        plan: plan._id,
        planBadge: plan.badge,
        planName: plan.name,
        amount: plan.price,
        currency: plan.currency || 'LKR',
        durationDays: plan.durationDays,
        status: 'completed',
        idempotencyKey: requestKey,
        activatedAt: now,
        expiresAt,
      }], { session });

      const updatedWallet = await Wallet.findOneAndUpdate(
        { user: senderId, balance: mongoose.trusted({ $gte: plan.price }) },
        { $inc: { balance: -plan.price, totalSpent: plan.price } },
        { new: true, session }
      );
      if (!updatedWallet) {
        const wallet = await Wallet.findOne({ user: senderId }).session(session);
        const error = new Error('Insufficient wallet balance.');
        error.statusCode = 400;
        error.required = plan.price;
        error.available = wallet?.balance || 0;
        throw error;
      }

      recipient.isPremium = true;
      recipient.premiumPlan = plan.badge;
      recipient.premiumSince = recipient.premiumSince || now;
      recipient.premiumStartedAt = recipient.premiumStartedAt || now;
      recipient.premiumExpiresAt = expiresAt;
      recipient.premiumStatus = 'active';
      recipient.premiumExpirySentNotification = false;
      await recipient.save({ session });

      const [walletTransaction] = await WalletTransaction.create([{
        wallet: updatedWallet._id,
        user: senderId,
        type: 'purchase',
        amount: plan.price,
        currency: plan.currency || 'LKR',
        description: `Gifted ${plan.name} (${plan.durationDays} Days) to ${recipient.name}`,
        relatedId: giftTransaction._id,
        relatedType: 'premium_gift',
        balanceBefore: updatedWallet.balance + plan.price,
        balanceAfter: updatedWallet.balance,
        status: 'completed',
      }], { session });

      giftTransaction.walletTransaction = walletTransaction._id;
      await giftTransaction.save({ session });

      await Notification.create([
        {
          user: recipient._id,
          type: 'premium_activated',
          message: `${req.user.name || 'A member'} gifted you ${plan.name}. Your Premium membership has been extended by ${plan.durationDays} days.`,
          relatedUser: senderId,
        },
        {
          user: senderId,
          type: 'gift',
          message: `Your ${plan.name} Premium gift was activated for ${recipient.name}.`,
          relatedUser: recipient._id,
        },
      ], { session });

      giftTransactionId = giftTransaction._id;
    });

    const completed = await PremiumGiftTransaction.findById(giftTransactionId)
      .populate('sender', 'name username profileImageUrl profileAvatar')
      .populate('recipient', 'name username profileImageUrl profileAvatar')
      .populate('plan', 'name badge price currency durationDays');
    return res.status(201).json(completed);
  } catch (error) {
    if (error.code === 11000) {
      const duplicate = await findExisting();
      if (duplicate && String(duplicate.recipient?._id || duplicate.recipient) === String(to) && duplicate.planBadge === planBadge) {
        return res.status(200).json(duplicate);
      }
      return res.status(409).json({ message: 'This payment request has already been processed.' });
    }
    return res.status(error.statusCode || 500).json({
      message: error.message || 'Failed to gift Premium.',
      ...(error.required !== undefined ? { required: error.required, available: error.available } : {}),
    });
  } finally {
    await session.endSession();
  }
};

// @desc    List Premium gift transactions for admin auditing
// @route   GET /api/gifts/admin/premium-transactions
// @access  Private/Admin
exports.getPremiumGiftTransactions = async (_req, res) => {
  try {
    const transactions = await PremiumGiftTransaction.find({})
      .populate('sender', 'name username email profileImageUrl profileAvatar')
      .populate('recipient', 'name username email profileImageUrl profileAvatar')
      .populate('plan', 'name badge price currency durationDays')
      .populate('walletTransaction', 'amount currency status createdAt')
      .sort({ createdAt: -1 })
      .limit(500);
    return res.json(transactions);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to load Premium gift history.' });
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
