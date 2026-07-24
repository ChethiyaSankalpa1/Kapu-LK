const mongoose = require('mongoose');

const premiumPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a plan name'],
    trim: true,
  },
  badge: {
    type: String,
    enum: ['bronze', 'silver', 'gold'],
    required: true,
    default: 'bronze',
  },
  price: {
    type: Number,
    required: [true, 'Please add a price'],
    min: 0,
  },
  currency: {
    type: String,
    default: 'LKR',
  },
  durationDays: {
    type: Number,
    required: [true, 'Please add plan duration in days'],
    min: 1,
  },
  description: {
    type: String,
    default: '',
  },
  features: [{
    type: String,
  }],
  isPopular: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('PremiumPlan', premiumPlanSchema);
