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
      enum: ['message', 'profile_view', 'match', 'profile_reminder', 'gift'],
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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Notification', notificationSchema);
