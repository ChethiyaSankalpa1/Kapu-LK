const mongoose = require('mongoose');

const premiumPaymentRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  bank: {
    type: String,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'ez_cash', 'binance', 'wallet', 'other'],
    default: 'bank_transfer',
  },
  accountHolderName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  transactionReference: {
    type: String,
    default: '',
  },
  paymentDate: {
    type: Date,
    required: true,
  },
  paymentAmount: {
    type: Number,
    required: true,
  },
  paymentSlipUrl: {
    type: String,
    required: true,
  },
  notes: {
    type: String,
    maxlength: 500,
  },
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PremiumPlan',
  },
  planBadge: {
    type: String,
    enum: ['bronze', 'silver', 'gold'],
    default: 'bronze',
  },
  durationDays: {
    type: Number,
    default: 10,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  rejectionReason: {
    type: String,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('PremiumPaymentRequest', premiumPaymentRequestSchema);
