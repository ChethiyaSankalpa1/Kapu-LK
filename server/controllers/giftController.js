const mongoose = require('mongoose');
const { Gift, GiftTransaction } = require('../models/Gift');
const User = require('../models/User');
const { UserStats } = require('../models/Achievement');
const { Wallet, WalletTransaction } = require('../models/Wallet');
const PremiumPlan = require('../models/PremiumPlan');
const PremiumGiftTransaction = require('../models/PremiumGiftTransaction');
const Notification = require('../models/Notification');
const Message = require('../models/Message');
const { getUserPremiumDetails } = require('../utils/entitlements');

// Helper function to check achievements
const { checkAchievements } = require('./achievementController');

// @desc    Get all available gifts
// @route   GET /api/gifts
// @access  Private
exports.getGifts = async (_req, res) => {
  try {
    // Use $ne filters that are compatible with Mongoose Boolean Schema casting,
    // while also tolerating legacy documents where isActive / isPremium fields
    // don't exist at all (MongoDB treats missing fields as undefined, which is
    // neither equal to true nor equal to false).
    // - $ne:false  → true OR missing
    // - $ne:true   → false OR missing
    const query = {
      isActive: mongoose.trusted({ $ne: false }),
      isPremium: mongoose.trusted({ $ne: true }),
    };

    let gifts = await Gift.find(query).sort({ category: 1, price: 1 });

    if (!gifts || gifts.length === 0) {
      const defaultGifts = [
        { name: 'Red Rose', emoji: '🌹', category: 'flowers', price: 50, currency: 'LKR', isActive: true, isPremium: false, isRecommended: true },
        { name: 'Love Heart', emoji: '❤️', category: 'hearts', price: 100, currency: 'LKR', isActive: true, isPremium: false, isRecommended: true },
        { name: 'Coffee Cup', emoji: '☕', category: 'drinks', price: 150, currency: 'LKR', isActive: true, isPremium: false },
        { name: 'Box of Chocolates', emoji: '🍫', category: 'food', price: 200, currency: 'LKR', isActive: true, isPremium: false },
        { name: 'Love Letter', emoji: '💌', category: 'gifts', price: 250, currency: 'LKR', isActive: true, isPremium: false },
        { name: 'Teddy Bear', emoji: '🧸', category: 'gifts', price: 300, currency: 'LKR', isActive: true, isPremium: false },
        { name: 'Bouquet', emoji: '💐', category: 'flowers', price: 500, currency: 'LKR', isActive: true, isPremium: false },
        { name: 'Starry Night', emoji: '⭐', category: 'special', price: 50, currency: 'POINTS', isActive: true, isPremium: false },
        { name: 'Sparkle Heart', emoji: '💖', category: 'hearts', price: 100, currency: 'POINTS', isActive: true, isPremium: false, isRecommended: true },
        { name: 'Fireworks', emoji: '🎆', category: 'special', price: 200, currency: 'POINTS', isActive: true, isPremium: false },
      ];
      try {
        await Gift.insertMany(defaultGifts, { ordered: false });
      } catch (seedErr) {
        const isOnlyDuplicates =
          seedErr.code === 11000 ||
          (seedErr.writeErrors && seedErr.writeErrors.length > 0 && seedErr.writeErrors.every((e) => e.code === 11000));
        if (!isOnlyDuplicates) {
          console.warn('[giftController.getGifts] Non-duplicate seeding warning:', seedErr && seedErr.message ? seedErr.message : seedErr);
        }
      }
      gifts = await Gift.find(query).sort({ category: 1, price: 1 });
    }

    res.json(gifts);
  } catch (error) {
    console.error('Error fetching gifts:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch gifts' });
  }
};


// @desc    Send a gift to a user
// @route   POST /api/gifts/send
// @access  Private
exports.sendGift = async (req, res) => {
  const { to, giftId, message, isAnonymous, idempotencyKey } = req.body;
  const sender = req.user._id;
  if (!to || !mongoose.isValidObjectId(to) || !giftId || !mongoose.isValidObjectId(giftId) ||
      typeof idempotencyKey !== 'string' || !idempotencyKey.trim() || idempotencyKey.length > 100) {
    return res.status(400).json({ message: 'Recipient, gift, and payment request key are required.' });
  }
  if (String(to) === String(sender)) {
    return res.status(400).json({ message: 'Cannot send gift to yourself' });
  }

  const requestKey = idempotencyKey.trim();
  const findExisting = () => GiftTransaction.findOne({ from: sender, idempotencyKey: requestKey });
  const existing = await findExisting();
  if (existing) {
    if (String(existing.to) !== String(to) || String(existing.gift) !== String(giftId) ||
      (existing.message || '') !== (message || '') || existing.isAnonymous !== Boolean(isAnonymous)) {
      return res.status(409).json({ message: 'This payment request key was already used for another gift.' });
    }
    const populated = await existing.populate([
      { path: 'gift' },
      { path: 'from', select: 'name profileImageUrl' },
      { path: 'to', select: 'name profileImageUrl' },
    ]);
    return res.status(200).json(populated);
  }

  const session = await mongoose.startSession();
  let transactionId;
  let senderStatsAfter;
  try {
    await session.withTransaction(async () => {
      const gift = await Gift.findOne({ _id: giftId, isActive: true }).session(session);
      if (!gift) {
        const error = new Error('Gift not found');
        error.statusCode = 404;
        throw error;
      }
      if (gift.isPremium || /premium/i.test(gift.name)) {
        const error = new Error('Choose a Bronze, Silver, or Gold plan to gift Premium.');
        error.statusCode = 400;
        throw error;
      }

      const recipient = await User.findById(to).session(session);
      if (!recipient) {
        const error = new Error('Recipient not found');
        error.statusCode = 404;
        throw error;
      }
      if (recipient.giftingOptIn === false) {
        const error = new Error(`${recipient.name} has opted out of receiving gifts.`);
        error.statusCode = 400;
        throw error;
      }

      const paymentCurrency = gift.currency || 'LKR';
      let updatedWallet;
      let balanceBefore = 0;
      if (gift.price > 0 && paymentCurrency === 'POINTS') {
        const statsAfterPayment = await UserStats.findOneAndUpdate(
          { user: sender, points: mongoose.trusted({ $gte: gift.price }) },
          { $inc: { points: -gift.price } },
          { new: true, session }
        );
        if (!statsAfterPayment) {
          const stats = await UserStats.findOne({ user: sender }).session(session);
          const error = new Error('Insufficient reward points.');
          error.statusCode = 400;
          error.required = gift.price;
          error.available = stats?.points || 0;
          throw error;
        }
      } else if (gift.price > 0) {
        updatedWallet = await Wallet.findOneAndUpdate(
          { user: sender, currency: paymentCurrency, balance: mongoose.trusted({ $gte: gift.price }) },
          { $inc: { balance: -gift.price, totalSpent: gift.price } },
          { new: true, session }
        );
        if (!updatedWallet) {
          const wallet = await Wallet.findOne({ user: sender, currency: paymentCurrency }).session(session);
          const error = new Error('Insufficient wallet balance');
          error.statusCode = 400;
          error.required = gift.price;
          error.available = wallet?.balance || 0;
          throw error;
        }
        balanceBefore = updatedWallet.balance + gift.price;
      }

      const [transaction] = await GiftTransaction.create([{
        from: sender,
        to,
        gift: giftId,
        message,
        isAnonymous,
        paymentAmount: gift.price,
        paymentCurrency,
        idempotencyKey: requestKey,
      }], { session });
      transactionId = transaction._id;

      if (updatedWallet) {
        await WalletTransaction.create([{
          wallet: updatedWallet._id,
          user: sender,
          type: 'purchase',
          amount: gift.price,
          currency: paymentCurrency,
          description: `Gift sent: ${gift.name}`,
          relatedId: transaction._id,
          relatedType: 'gift',
          balanceBefore,
          balanceAfter: updatedWallet.balance,
          status: 'completed',
        }], { session });
      }

      let userStats = await UserStats.findOne({ user: sender }).session(session);
      if (!userStats) userStats = new UserStats({ user: sender });
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (userStats.lastGiftDate) {
        const lastGift = new Date(userStats.lastGiftDate);
        lastGift.setHours(0, 0, 0, 0);
        if (lastGift.getTime() !== today.getTime()) userStats.dailyGiftsSent = 0;
      }
      userStats.dailyGiftsSent = (userStats.dailyGiftsSent || 0) + 1;
      userStats.lastGiftDate = today;
      userStats.totalGiftsSent += 1;
      userStats.points += 5;
      await userStats.save({ session });
      senderStatsAfter = userStats;

      let recipientStats = await UserStats.findOne({ user: to }).session(session);
      if (!recipientStats) recipientStats = new UserStats({ user: to });
      recipientStats.totalGiftsReceived += 1;
      const pointsEarned = Math.max(5, Math.floor(gift.price * 0.1));
      recipientStats.points += pointsEarned;
      await recipientStats.save({ session });

      await Notification.create([{
        user: to,
        type: 'gift_received',
        message: isAnonymous
          ? `Someone sent you a gift (${gift.name} ${gift.emoji})! You earned ${pointsEarned} points!`
          : `${req.user.name} sent you a gift (${gift.name} ${gift.emoji})! You earned ${pointsEarned} points!`,
        relatedUser: sender,
        relatedGift: transaction._id,
      const isPremiumConvo = Boolean(
        (recipient && getUserPremiumDetails(recipient).isPremium) ||
        (req.user && getUserPremiumDetails(req.user).isPremium)
      );
      const giftMsgExpiresAt = new Date(Date.now() + (isPremiumConvo ? 48 * 60 * 60 * 1000 : 36 * 60 * 60 * 1000));

      const giftMessage = isAnonymous
        ? (message ? `🎁 Received an anonymous gift: ${gift.name} ${gift.emoji}\n"${message}"` : `🎁 Received an anonymous gift: ${gift.name} ${gift.emoji}`)
        : (message ? `🎁 Sent a gift: ${gift.name} ${gift.emoji}\n"${message}"` : `🎁 Sent a gift: ${gift.name} ${gift.emoji}`);
      await Message.create([{
        from: sender,
        to,
        content: giftMessage,
        type: 'gift',
        expiresAt: giftMsgExpiresAt,
      }], { session });
    });

    try {
      await checkAchievements(sender, senderStatsAfter);
    } catch (achievementError) {
      console.error('Gift sent, but achievement update failed:', achievementError);
    }
    const populatedTransaction = await GiftTransaction.findById(transactionId)
      .populate('gift')
      .populate('from', 'name profileImageUrl')
      .populate('to', 'name profileImageUrl');
    return res.status(201).json(populatedTransaction);
  } catch (error) {
    if (error.code === 11000) {
      const duplicate = await findExisting();
      if (duplicate && String(duplicate.to) === String(to) && String(duplicate.gift) === String(giftId)) {
        const populated = await duplicate.populate([
          { path: 'gift' },
          { path: 'from', select: 'name profileImageUrl' },
          { path: 'to', select: 'name profileImageUrl' },
        ]);
        return res.status(200).json(populated);
      }
      return res.status(409).json({ message: 'This payment request has already been processed.' });
    }
    return res.status(error.statusCode || 500).json({
      message: error.message || 'Failed to send gift',
      ...(error.required !== undefined ? { required: error.required, available: error.available } : {}),
    });
  } finally {
    await session.endSession();
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

      const paymentCurrency = plan.currency || 'LKR';
      const updatedWallet = await Wallet.findOneAndUpdate(
        { user: senderId, currency: paymentCurrency, balance: mongoose.trusted({ $gte: plan.price }) },
        { $inc: { balance: -plan.price, totalSpent: plan.price } },
        { new: true, session }
      );
      if (!updatedWallet) {
        const wallet = await Wallet.findOne({ user: senderId, currency: paymentCurrency }).session(session);
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
