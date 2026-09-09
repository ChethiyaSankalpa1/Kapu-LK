const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  reportedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  reason: {
    type: String,
    required: [true, 'Please specify a reason for the report'],
    trim: true,
    maxlength: 200,
  },
  details: {
    type: String,
    trim: true,
    maxlength: 1000,
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'dismissed', 'action_taken'],
    default: 'pending',
    index: true,
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  resolutionNotes: {
    type: String,
  },
}, {
  timestamps: true,
});

reportSchema.index({ reporter: 1, reportedUser: 1 });

module.exports = mongoose.model('Report', reportSchema);
