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
    enum: ['Hatton National Bank (HNB)', 'Sampath Bank', 'Bank of Ceylon (BOC)', 'Regional Development Bank (RDB)'],
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
    validate: {
      validator: (value) => /^[0-9]+$/.test(value),
      message: 'Phone number must contain only numbers',
    },
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
    default: 7,
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
