const mongoose = require('mongoose');

const ReferralSchema = new mongoose.Schema({
  referrer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  referred: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  referralCode: {
    type: String,
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'rewarded'],
    default: 'pending'
  },
  creditsEarned: {
    type: Number,
    default: 0
  },
  completedAt: {
    type: Date
  },
  rewardedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Referral code for users
const ReferralCodeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  totalReferrals: {
    type: Number,
    default: 0
  },
  successfulReferrals: {
    type: Number,
    default: 0
  },
  totalCreditsEarned: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

ReferralSchema.index({ referrer: 1, referred: 1 }, { unique: true });

const Referral = mongoose.model('Referral', ReferralSchema);
const ReferralCode = mongoose.model('ReferralCode', ReferralCodeSchema);

module.exports = { Referral, ReferralCode };
