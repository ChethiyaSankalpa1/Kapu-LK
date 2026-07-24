const { Referral, ReferralCode } = require('../models/Referral');
const User = require('../models/User');
const { UserStats } = require('../models/Achievement');
const { addReward } = require('./walletController');
const crypto = require('crypto');

// Generate unique referral code
function generateReferralCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

// @desc    Get current user's referral code
// @route   GET /api/referrals/my-code
// @access  Private
exports.getMyReferralCode = async (req, res) => {
  try {
    const userId = req.user._id;
    
    let referralCode = await ReferralCode.findOne({ user: userId });
    
    if (!referralCode) {
      const code = generateReferralCode();
      referralCode = await ReferralCode.create({
        user: userId,
        code,
        isActive: true
      });
    }

    res.json(referralCode);
  } catch (error) {
    console.error('Error fetching referral code:', error);
    res.status(500).json({ message: 'Failed to fetch referral code' });
  }
};

// @desc    Apply referral code during registration
// @route   POST /api/referrals/apply
// @access  Private
exports.applyReferralCode = async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user._id;

    if (!code) {
      return res.status(400).json({ message: 'Referral code is required' });
    }

    const referralCode = await ReferralCode.findOne({ code, isActive: true });
    if (!referralCode) {
      return res.status(404).json({ message: 'Invalid referral code' });
    }

    if (referralCode.user.toString() === userId.toString()) {
      return res.status(400).json({ message: 'Cannot use your own referral code' });
    }

    // Check if already used
    const existingReferral = await Referral.findOne({ referred: userId });
    if (existingReferral) {
      return res.status(400).json({ message: 'Already used a referral code' });
    }

    // Create referral
    const referral = await Referral.create({
      referrer: referralCode.user,
      referred: userId,
      referralCode: code,
      status: 'pending'
    });

    // Update referrer's stats
    referralCode.totalReferrals += 1;
    await referralCode.save();

    let referrerStats = await UserStats.findOne({ user: referralCode.user });
    if (!referrerStats) {
      referrerStats = new UserStats({ user: referralCode.user });
    }
    referrerStats.totalReferrals += 1;
    referrerStats.points += 50; // Bonus for referral
    await referrerStats.save();

    // Add wallet reward for referrer
    try {
      await addReward(referralCode.user, 50, 'Referral bonus', 'referral', referral._id);
    } catch (error) {
      console.error('Error adding referral reward:', error);
    }

    // Give referred user bonus
    let userStats = await UserStats.findOne({ user: userId });
    if (!userStats) {
      userStats = new UserStats({ user: userId });
    }
    userStats.points += 25; // Bonus for using referral
    await userStats.save();

    // Add wallet reward for referred user
    try {
      await addReward(userId, 25, 'Referral signup bonus', 'referral', referral._id);
    } catch (error) {
      console.error('Error adding signup bonus:', error);
    }

    res.status(201).json({
      message: 'Referral code applied successfully',
      creditsEarned: 25,
      referral
    });
  } catch (error) {
    console.error('Error applying referral code:', error);
    res.status(500).json({ message: 'Failed to apply referral code' });
  }
};

// @desc    Complete referral (when referred user completes profile)
// @route   POST /api/referrals/:id/complete
// @access  Private
exports.completeReferral = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const referral = await Referral.findById(id);
    if (!referral) {
      return res.status(404).json({ message: 'Referral not found' });
    }

    if (referral.referred.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (referral.status !== 'pending') {
      return res.status(400).json({ message: 'Referral already processed' });
    }

    // Mark as completed
    referral.status = 'completed';
    referral.completedAt = new Date();
    referral.creditsEarned = 100;
    await referral.save();

    // Update referrer
    let referrerStats = await UserStats.findOne({ user: referral.referrer });
    if (referrerStats) {
      referrerStats.points += 100;
      await referrerStats.save();
    }

    // Update referral code stats
    const referralCode = await ReferralCode.findOne({ user: referral.referrer });
    if (referralCode) {
      referralCode.successfulReferrals += 1;
      referralCode.totalCreditsEarned += 100;
      await referralCode.save();
    }

    res.json({
      message: 'Referral completed successfully',
      creditsEarned: 100
    });
  } catch (error) {
    console.error('Error completing referral:', error);
    res.status(500).json({ message: 'Failed to complete referral' });
  }
};

// @desc    Get referral history
// @route   GET /api/referrals/history
// @access  Private
exports.getReferralHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    const referrals = await Referral.find({
      $or: [{ referrer: userId }, { referred: userId }]
    })
      .populate('referrer', 'name profileImageUrl')
      .populate('referred', 'name profileImageUrl')
      .sort({ createdAt: -1 });

    res.json(referrals);
  } catch (error) {
    console.error('Error fetching referral history:', error);
    res.status(500).json({ message: 'Failed to fetch referral history' });
  }
};

// @desc    Get referral stats
// @route   GET /api/referrals/stats
// @access  Private
exports.getReferralStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const referralCode = await ReferralCode.findOne({ user: userId });
    const referrals = await Referral.find({ referrer: userId });

    const stats = {
      totalReferrals: referralCode?.totalReferrals || 0,
      successfulReferrals: referralCode?.successfulReferrals || 0,
      totalCreditsEarned: referralCode?.totalCreditsEarned || 0,
      pendingReferrals: referrals.filter(r => r.status === 'pending').length,
      completedReferrals: referrals.filter(r => r.status === 'completed').length
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching referral stats:', error);
    res.status(500).json({ message: 'Failed to fetch referral stats' });
  }
};
