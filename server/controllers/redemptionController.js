const mongoose = require('mongoose');
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
          _id: 'default_premium_1d',
          rewardType: 'premium',
          rewardName: '1-Day Premium Membership',
          pointsCost: 150,
          isActive: true
        },
        {
          _id: 'default_premium_7d',
          rewardType: 'premium',
          rewardName: '7 Days Premium Membership',
          pointsCost: 450,
          isActive: true
        },
        {
          _id: 'default_premium_30d',
          rewardType: 'premium',
          rewardName: '30 Days Premium Membership',
          pointsCost: 1200,
          isActive: true
        },
        {
          _id: 'default_wallet',
          rewardType: 'wallet',
          rewardName: 'Rs. 500 Wallet Cash',
          pointsCost: 500,
          isActive: true
        },
        {
          _id: 'default_boost',
          rewardType: 'boost',
          rewardName: '7-Day Profile Boost',
          pointsCost: 300,
          isActive: true
        },
        {
          _id: 'default_badge',
          rewardType: 'badge',
          rewardName: 'VIP Profile Badge',
          pointsCost: 200,
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

// Canonical costs dictionary for tamper protection
const CANONICAL_COSTS = {
  '1-day premium membership': 150,
  '7 days premium membership': 450,
  '30 days premium membership': 1200,
  'rs. 500 wallet cash': 500,
  '7-day profile boost': 300,
  'vip profile badge': 200,
};

// @desc    Redeem points for reward
// @route   POST /api/redemption/redeem
// @access  Private
exports.redeemPoints = async (req, res) => {
  try {
    const userId = req.user._id;
    const { rewardType, rewardName, configId } = req.body;

    if (!rewardType || !rewardName) {
      return res.status(400).json({ message: 'Missing required fields: rewardType and rewardName are required' });
    }

    // Determine authentic server-side points cost
    let verifiedCost = null;
    if (configId && mongoose.Types.ObjectId.isValid(configId)) {
      const dbConfig = await RedemptionConfig.findById(configId);
      if (dbConfig && dbConfig.isActive) {
        verifiedCost = dbConfig.pointsCost;
      }
    }

    if (!verifiedCost) {
      const cleanName = rewardName.toLowerCase().trim();
      verifiedCost = CANONICAL_COSTS[cleanName];
    }

    // Fallback based on type if exact name didn't match canonical list
    if (!verifiedCost) {
      if (rewardType === 'wallet') verifiedCost = 500;
      else if (rewardType === 'premium') {
        if (rewardName.includes('30')) verifiedCost = 1200;
        else if (rewardName.includes('7')) verifiedCost = 450;
        else verifiedCost = 150;
      } else if (rewardType === 'boost') verifiedCost = 300;
      else if (rewardType === 'badge') verifiedCost = 200;
      else verifiedCost = 500;
    }

    const pointsCost = verifiedCost;

    // Check for duplicate redemption (prevent spam)
    try {
      const recentRedemption = await Redemption.findOne({
        user: userId,
        rewardType,
        status: mongoose.trusted({ $in: ['pending', 'completed'] }),
        createdAt: mongoose.trusted({ $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }) // Last 24 hours
      });

      if (recentRedemption) {
        return res.status(400).json({ message: 'You have already redeemed this reward in the last 24 hours. Please try again later.' });
      }
    } catch (recentError) {
      console.error('Error checking recent redemptions:', recentError);
    }

    // ATOMIC deduction of points: eliminates race conditions and double-spending
    const updatedStats = await UserStats.findOneAndUpdate(
      { user: userId, points: mongoose.trusted({ $gte: pointsCost }) },
      { $inc: { points: -pointsCost } },
      { new: true }
    );

    if (!updatedStats) {
      const currentStats = await UserStats.findOne({ user: userId });
      const currentPoints = currentStats ? currentStats.points : 0;
      return res.status(400).json({
        message: `Insufficient points. You have ${currentPoints} points but this reward requires ${pointsCost} points.`,
      });
    }

    // Create redemption record
    let redemption;
    try {
      redemption = await Redemption.create({
        user: userId,
        rewardType,
        rewardName,
        pointsCost,
        status: 'pending',
        metadata: {}
      });
    } catch (createError) {
      // Refund points if record creation fails
      await UserStats.findOneAndUpdate({ user: userId }, { $inc: { points: pointsCost } });
      console.error('Error creating redemption record:', createError);
      return res.status(500).json({ message: 'Failed to create redemption record. Points refunded.' });
    }

    // Process the redemption based on type
    let completed = false;
    let errorMessage = null;

    try {
      switch (rewardType) {
        case 'premium':
          // Grant premium membership (1 day, 7 days, or 30 days)
          const user = await User.findById(userId);
          if (user) {
            user.isPremium = true;
            let days = 30;
            if (rewardName.toLowerCase().includes('1-day') || pointsCost <= 150) {
              days = 1;
            } else if (rewardName.toLowerCase().includes('7 day') || pointsCost <= 450) {
              days = 7;
            } else {
              days = 30;
            }

            const currentExp = (user.premiumExpiresAt && user.premiumExpiresAt > new Date())
              ? user.premiumExpiresAt
              : new Date();
            user.premiumExpiresAt = new Date(currentExp.getTime() + days * 24 * 60 * 60 * 1000);
            await user.save();
            completed = true;
            redemption.metadata.premiumExpiresAt = user.premiumExpiresAt;
            redemption.metadata.daysGranted = days;
          } else {
            errorMessage = 'User not found';
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
          const cashAmount = 500; // 500 LKR wallet cash
          const updatedWallet = await Wallet.findOneAndUpdate(
            { user: userId },
            { $inc: { balance: cashAmount, totalDeposited: cashAmount } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
          let userWallet = updatedWallet;
          
          try {
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
          } catch (txError) {
            console.error('Error creating wallet transaction:', txError);
            // Continue anyway, wallet balance is updated
          }
          
          completed = true;
          redemption.metadata.walletAmountAdded = cashAmount;
          break;

        case 'custom':
          // Custom reward - mark as pending for admin review
          completed = false;
          redemption.metadata.pendingAdminReview = true;
          break;

        default:
          errorMessage = `Unknown reward type: ${rewardType}`;
      }
    } catch (processError) {
      console.error('Error processing redemption:', processError);
      errorMessage = 'Failed to process reward. Please try again.';
    }

    // Update redemption status
    if (completed) {
      redemption.status = 'completed';
      redemption.completedAt = new Date();
    } else if (errorMessage) {
      redemption.status = 'failed';
      redemption.metadata.error = errorMessage;
      // Refund points on failure
      try {
        await UserStats.findOneAndUpdate(
          { user: userId },
          { $inc: { points: pointsCost } }
        );
      } catch (refundError) {
        console.error('Error refunding points:', refundError);
      }
    }

    try {
      await redemption.save();
    } catch (saveError) {
      console.error('Error saving redemption:', saveError);
      return res.status(500).json({ message: 'Failed to save redemption record. Please contact support.' });
    }

    res.status(201).json({
      redemption,
      message: completed ? 'Redemption successful!' : errorMessage || 'Redemption submitted for review'
    });
  } catch (error) {
    console.error('Error redeeming points:', error);
    res.status(500).json({ message: 'An unexpected error occurred. Please try again later.' });
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

// @desc    Delete redemption config (admin)
// @route   DELETE /api/redemption/admin/config/:id
// @access  Private/Admin
exports.deleteRedemptionConfig = async (req, res) => {
  try {
    const config = await RedemptionConfig.findByIdAndDelete(req.params.id);

    if (!config) {
      return res.status(404).json({ message: 'Config not found' });
    }

    res.json({ message: 'Config deleted successfully' });
  } catch (error) {
    console.error('Error deleting redemption config:', error);
    res.status(500).json({ message: 'Failed to delete config' });
  }
};
