const mongoose = require('mongoose');

const WalletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    enum: ['LKR', 'USD'],
    default: 'LKR'
  },
  totalDeposited: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Wallet transaction history
const WalletTransactionSchema = new mongoose.Schema({
  wallet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'purchase', 'refund', 'reward', 'bonus'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    enum: ['LKR', 'USD'],
    default: 'LKR'
  },
  description: {
    type: String,
    required: true
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId
  },
  relatedType: {
    type: String,
    enum: ['gift', 'premium', 'premium_gift', 'payment', 'referral', 'achievement', 'daily_checkin']
  },
  balanceBefore: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'completed'
  }
}, {
  timestamps: true
});

// Payment request for bank slip & manual uploads
const PaymentRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    enum: ['LKR', 'USD'],
    default: 'LKR'
  },
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'ez_cash', 'binance', 'mobile_banking', 'other'],
    default: 'bank_transfer'
  },
  bankName: {
    type: String,
    required: true
  },
  accountNumber: {
    type: String,
    default: ''
  },
  accountHolder: {
    type: String,
    default: ''
  },
  branch: {
    type: String,
    default: ''
  },
  payerName: {
    type: String,
    default: ''
  },
  payerPhone: {
    type: String,
    default: ''
  },
  transactionReference: {
    type: String,
    required: true
  },
  slipImageUrl: {
    type: String,
    required: true
  },
  notes: {
    type: String,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

WalletTransactionSchema.index({ user: 1, createdAt: -1 });
PaymentRequestSchema.index({ user: 1, status: 1, createdAt: -1 });

const Wallet = mongoose.model('Wallet', WalletSchema);
const WalletTransaction = mongoose.model('WalletTransaction', WalletTransactionSchema);
const PaymentRequest = mongoose.model('PaymentRequest', PaymentRequestSchema);

module.exports = { Wallet, WalletTransaction, PaymentRequest };
