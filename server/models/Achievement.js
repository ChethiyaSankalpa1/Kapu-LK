const mongoose = require('mongoose');

const AchievementSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['profile', 'messaging', 'social', 'engagement', 'premium', 'special'],
    required: true
  },
  points: {
    type: Number,
    default: 10
  },
  rarity: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
    default: 'bronze'
  },
  condition: {
    type: {
      type: String,
      enum: ['profile_complete', 'messages_sent', 'login_streak', 'referrals', 'gifts_sent', 'events_attended', 'blog_posts', 'success_story'],
      required: true
    },
    target: {
      type: Number,
      required: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// User achievement (when a user earns an achievement)
const UserAchievementSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  achievement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Achievement',
    required: true
  },
  earnedAt: {
    type: Date,
    default: Date.now
  },
  progress: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// User stats for gamification
const UserStatsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  points: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  loginStreak: {
    type: Number,
    default: 0
  },
  lastLoginDate: {
    type: Date
  },
  totalMessagesSent: {
    type: Number,
    default: 0
  },
  totalGiftsSent: {
    type: Number,
    default: 0
  },
  totalGiftsReceived: {
    type: Number,
    default: 0
  },
  totalReferrals: {
    type: Number,
    default: 0
  },
  totalEventsAttended: {
    type: Number,
    default: 0
  },
  achievements: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserAchievement'
  }]
}, {
  timestamps: true
});

const Achievement = mongoose.model('Achievement', AchievementSchema);
const UserAchievement = mongoose.model('UserAchievement', UserAchievementSchema);
const UserStats = mongoose.model('UserStats', UserStatsSchema);

module.exports = { Achievement, UserAchievement, UserStats };
