const mongoose = require('mongoose');

const GiftSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  emoji: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['flowers', 'hearts', 'food', 'drinks', 'gifts', 'special'],
    default: 'gifts'
  },
  price: {
    type: Number,
    required: true,
    default: 0
  },
  currency: {
    type: String,
    enum: ['LKR', 'USD', 'POINTS'],
    default: 'LKR'
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  isRecommended: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    default: 'common'
  }
}, {
  timestamps: true
});

// Gift transaction (when a gift is sent)
const GiftTransactionSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  gift: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gift',
    required: true
  },
  message: {
    type: String,
    trim: true,
    maxlength: 200
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  paymentAmount: {
    type: Number,
    min: 0
  },
  paymentCurrency: {
    type: String,
    enum: ['LKR', 'USD', 'POINTS'],
    default: 'LKR'
  },
  idempotencyKey: {
    type: String,
    maxlength: 100
  }
}, {
  timestamps: true
});

GiftTransactionSchema.index(
  { from: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } }
);

const Gift = mongoose.model('Gift', GiftSchema);
const GiftTransaction = mongoose.model('GiftTransaction', GiftTransactionSchema);

module.exports = { Gift, GiftTransaction };
