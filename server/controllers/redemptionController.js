const { Redemption, RedemptionConfig } = require('../models/Redemption');
const User = require('../models/User');
const { UserStats } = require('../models/Achievement');
const { Wallet, WalletTransaction } = require('../models/Wallet');

// @desc    Get redemption configurations
// @route   GET /api/redemption/configs
// @access  Public
exports.getRedemptionConfigs = async (req, res) => {
  try {
    let configs = await RedemptionConfig.find({ isActive: true });
    if (!configs || configs.length === 0) {
      configs = [
        {
          _id: 'default_premium',
          rewardType: 'premium',
          rewardName: '30 Days Premium Membership',
          pointsCost: 100,
          isActive: true
        },
        {
          _id: 'default_wallet',
          rewardType: 'wallet',
          rewardName: 'Rs. 500 Wallet Cash',
          pointsCost: 50,
          isActive: true
        },
        {
          _id: 'default_boost',
          rewardType: 'boost',
          rewardName: '7-Day Profile Boost',
          pointsCost: 30,
          isActive: true
        },
        {
          _id: 'default_badge',
          rewardType: 'badge',
          rewardName: 'VIP Profile Badge',
          pointsCost: 20,
          isActive: true
        }
      ];
    }
    res.json(configs);
  } catch (error) {
    console.error('Error fetching redemption configs:', error);
    res.status(500).json({ message: 'Failed to fetch redemption configs' });
  }
};

// @desc    Get user redemption history
// @route   GET /api/redemption/history
// @access  Private
exports.getRedemptionHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const redemptions = await Redemption.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(redemptions);
  } catch (error) {
    console.error('Error fetching redemption history:', error);
    res.status(500).json({ message: 'Failed to fetch redemption history' });
  }
};

// @desc    Redeem points for reward
// @route   POST /api/redemption/redeem
// @access  Private
exports.redeemPoints = async (req, res) => {
  try {
    const userId = req.user._id;
    const { rewardType, rewardName, pointsCost } = req.body;

    if (!rewardType || !rewardName || !pointsCost) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if user has enough points
    const userStats = await UserStats.findOne({ user: userId });
    if (!userStats || userStats.points < pointsCost) {
      return res.status(400).json({ message: 'Insufficient points' });
    }

    // Check for duplicate redemption (prevent spam)
    const recentRedemption = await Redemption.findOne({
      user: userId,
      rewardType,
      status: { $in: ['pending', 'completed'] },
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    });

    if (recentRedemption) {
      return res.status(400).json({ message: 'You have already redeemed this reward in the last 24 hours' });
    }

    // Create redemption record
    const redemption = await Redemption.create({
      user: userId,
      rewardType,
      rewardName,
      pointsCost,
      status: 'pending',
      metadata: {}
    });

    // Deduct points
    userStats.points -= pointsCost;
    await userStats.save();

    // Process the redemption based on type
    let completed = false;
    let errorMessage = null;

    try {
      switch (rewardType) {
        case 'premium':
          // Grant premium membership
          const user = await User.findById(userId);
          if (user) {
            user.isPremium = true;
            user.premiumExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
            await user.save();
            completed = true;
            redemption.metadata.premiumExpiresAt = user.premiumExpiresAt;
          }
          break;

        case 'gift':
          // Add gift to user's inventory or send to themselves
          completed = true;
          redemption.metadata.giftSent = true;
          break;

        case 'boost':
          // Apply profile boost
          completed = true;
          redemption.metadata.boostApplied = true;
          break;

        case 'badge':
          // Award badge
          completed = true;
          redemption.metadata.badgeAwarded = true;
          break;

        case 'wallet':
          let userWallet = await Wallet.findOne({ user: userId });
          if (!userWallet) {
            userWallet = await Wallet.create({ user: userId });
          }
          const cashAmount = pointsCost * 10; // 1 point = 10 LKR
          userWallet.balance += cashAmount;
          userWallet.totalDeposits += cashAmount;
          await userWallet.save();
          await WalletTransaction.create({
            wallet: userWallet._id,
            user: userId,
            type: 'reward',
            amount: cashAmount,
            currency: 'LKR',
            description: `Redeemed ${pointsCost} points for Rs. ${cashAmount} wallet cash`,
            balanceBefore: userWallet.balance - cashAmount,
            balanceAfter: userWallet.balance,
            status: 'completed'
          });
          completed = true;
          redemption.metadata.walletAmountAdded = cashAmount;
          break;

        case 'custom':
          // Custom reward - mark as pending for admin review
          completed = false;
          redemption.metadata.pendingAdminReview = true;
          break;

        default:
          errorMessage = 'Unknown reward type';
      }
    } catch (processError) {
      console.error('Error processing redemption:', processError);
      errorMessage = 'Failed to process reward';
    }

    // Update redemption status
    if (completed) {
      redemption.status = 'completed';
      redemption.completedAt = new Date();
    } else if (errorMessage) {
      redemption.status = 'failed';
      redemption.metadata.error = errorMessage;
      // Refund points on failure
      userStats.points += pointsCost;
      await userStats.save();
    }

    await redemption.save();

    res.status(201).json({
      redemption,
      message: completed ? 'Redemption successful!' : errorMessage || 'Redemption submitted for review'
    });
  } catch (error) {
    console.error('Error redeeming points:', error);
    res.status(500).json({ message: 'Failed to redeem points' });
  }
};

// @desc    Get all redemptions (admin)
// @route   GET /api/redemption/admin/all
// @access  Private/Admin
exports.getAllRedemptions = async (req, res) => {
  try {
    const redemptions = await Redemption.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(redemptions);
  } catch (error) {
    console.error('Error fetching all redemptions:', error);
    res.status(500).json({ message: 'Failed to fetch redemptions' });
  }
};

// @desc    Update redemption config (admin)
// @route   PUT /api/redemption/admin/config/:id
// @access  Private/Admin
exports.updateRedemptionConfig = async (req, res) => {
  try {
    const { pointsCost, isActive, metadata } = req.body;
    
    const config = await RedemptionConfig.findByIdAndUpdate(
      req.params.id,
      { pointsCost, isActive, metadata, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!config) {
      return res.status(404).json({ message: 'Config not found' });
    }

    res.json(config);
  } catch (error) {
    console.error('Error updating redemption config:', error);
    res.status(500).json({ message: 'Failed to update config' });
  }
};

// @desc    Create redemption config (admin)
// @route   POST /api/redemption/admin/config
// @access  Private/Admin
exports.createRedemptionConfig = async (req, res) => {
  try {
    const { rewardType, rewardName, pointsCost, isActive, metadata } = req.body;

    const config = await RedemptionConfig.create({
      rewardType,
      rewardName,
      pointsCost,
      isActive: isActive !== undefined ? isActive : true,
      metadata
    });

    res.status(201).json(config);
  } catch (error) {
    console.error('Error creating redemption config:', error);
    res.status(500).json({ message: 'Failed to create config' });
  }
};
