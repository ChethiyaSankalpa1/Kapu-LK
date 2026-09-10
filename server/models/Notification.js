const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['message', 'profile_view', 'match', 'profile_reminder', 'gift', 'gift_received', 'achievement', 'premium_activated', 'premium_expiring', 'premium_expired', 'wallet_topup', 'system', 'support_reply'],
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    relatedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    relatedGift: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GiftTransaction',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    viewCount: {
      type: Number,
      default: 1,
    },
    lastViewedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ user: 1, relatedUser: 1, type: 1, lastViewedAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
