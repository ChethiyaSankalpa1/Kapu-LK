const mongoose = require('mongoose');

const premiumGiftTransactionSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PremiumPlan',
    required: true,
  },
  planBadge: {
    type: String,
    enum: ['bronze', 'silver', 'gold'],
    required: true,
  },
  planName: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    enum: ['LKR', 'USD'],
    default: 'LKR',
  },
  durationDays: {
    type: Number,
    required: true,
    min: 1,
  },
  status: {
    type: String,
    enum: ['completed'],
    default: 'completed',
  },
  idempotencyKey: {
    type: String,
    required: true,
    maxlength: 100,
  },
  walletTransaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WalletTransaction',
  },
  activatedAt: {
    type: Date,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
}, {
  timestamps: true,
});

premiumGiftTransactionSchema.index({ sender: 1, idempotencyKey: 1 }, { unique: true });
premiumGiftTransactionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('PremiumGiftTransaction', premiumGiftTransactionSchema);