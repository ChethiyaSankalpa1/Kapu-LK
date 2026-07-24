const mongoose = require('mongoose');

const TypingIndicatorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  conversationWith: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isTyping: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
    expires: 30 // Auto-delete after 30 seconds of inactivity
  }
}, {
  timestamps: true
});

// Index for quick lookups
TypingIndicatorSchema.index({ user: 1, conversationWith: 1 }, { unique: true });

const TypingIndicator = mongoose.model('TypingIndicator', TypingIndicatorSchema);

module.exports = TypingIndicator;
