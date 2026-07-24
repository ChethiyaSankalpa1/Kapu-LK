const mongoose = require('mongoose');

const redemptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rewardType: {
    type: String,
    enum: ['premium', 'gift', 'boost', 'badge', 'custom', 'wallet'],
    required: true
  },
  rewardName: {
    type: String,
    required: true
  },
  pointsCost: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  }
});

const RedemptionConfigSchema = new mongoose.Schema({
  rewardType: {
    type: String,
    enum: ['premium', 'gift', 'boost', 'badge', 'custom', 'wallet'],
    required: true,
    unique: true
  },
  rewardName: {
    type: String,
    required: true
  },
  pointsCost: {
    type: Number,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Redemption = mongoose.model('Redemption', redemptionSchema);
const RedemptionConfig = mongoose.model('RedemptionConfig', RedemptionConfigSchema);

module.exports = { Redemption, RedemptionConfig };
