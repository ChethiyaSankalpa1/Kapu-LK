const mongoose = require('mongoose');

const SuccessStorySchema = new mongoose.Schema({
  coupleName: {
    type: String,
    required: true,
    trim: true
  },
  user1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  user2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  story: {
    type: String,
    required: true,
    maxlength: 5000
  },
  photos: [{
    type: String
  }],
  weddingDate: {
    type: Date
  },
  howWeMet: {
    type: String,
    maxlength: 1000
  },
  advice: {
    type: String,
    maxlength: 500
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  likeCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const SuccessStory = mongoose.model('SuccessStory', SuccessStorySchema);

module.exports = SuccessStory;
