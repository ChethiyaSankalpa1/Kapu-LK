const { Achievement, UserAchievement, UserStats } = require('../models/Achievement');
const { addReward } = require('./walletController');
const User = require('../models/User');
const Notification = require('../models/Notification');

const DEFAULT_ACHIEVEMENTS = [
  { name: '🌅 Daily Check-in', description: 'Log in to Kapu LK daily', icon: '🌅', category: 'daily', points: 5, condition: { type: 'login_streak', target: 1 } },
  { name: '👤 First Steps', description: 'Complete your profile for the first time', icon: '👤', category: 'profile', points: 50, condition: { type: 'profile_complete', target: 1 } },
  { name: '💬 Social Butterfly', description: 'Send 10 messages in chat', icon: '💬', category: 'communication', points: 15, condition: { type: 'messages_sent', target: 10 } },
  { name: '🎁 Generous Heart', description: 'Send a gift to a match', icon: '🎁', category: 'social', points: 20, condition: { type: 'gifts_sent', target: 1 } },
  { name: '🔥 7-Day Streak', description: 'Log in 7 consecutive days', icon: '🔥', category: 'streak', points: 50, condition: { type: 'login_streak', target: 7 } },
  { name: '👑 Royal Supporter', description: 'Send 5 gifts to matches', icon: '👑', category: 'social', points: 75, condition: { type: 'gifts_sent', target: 5 } }
];

const checkProfileComplete = (user) => {
  if (!user) return 0;
  const fields = ['name', 'profileImageUrl', 'age', 'gender', 'location', 'bio', 'education', 'occupation'];
  let filled = 0;
  fields.forEach(f => {
    if (user[f] && String(user[f]).trim() !== '') filled++;
  });
  return filled >= 5 ? 1 : 0;
};

// @desc    Get all achievements
// @route   GET /api/achievements
// @access  Private
exports.getAchievements = async (req, res) => {
  try {
    let achievements = await Achievement.find({ isActive: true }).sort({ category: 1, points: -1 });
    if (!achievements || achievements.length === 0) {
      achievements = await Achievement.insertMany(DEFAULT_ACHIEVEMENTS);
    }
    res.json(achievements);
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({ message: 'Failed to fetch achievements' });
  }
};

// @desc    Get current user's stats and achievements
// @route   GET /api/achievements/my-stats
// @access  Private
exports.getMyStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const userDoc = await User.findById(userId);
    
    let userStats = await UserStats.findOne({ user: userId })
      .populate('achievements')
      .populate({
        path: 'achievements',
        populate: {
          path: 'achievement',
          model: 'Achievement'
        }
      });

    if (!userStats) {
      userStats = new UserStats({ user: userId });
      await userStats.save();
    }

    // Only run checkAchievements if userStats was just created or if it's been more than 1 hour since last check
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const shouldCheck = !userStats.updatedAt || new Date(userStats.updatedAt) < oneHourAgo;
      
      if (shouldCheck) {
        await checkAchievements(userId, userStats, userDoc);
        // Refresh userStats after check
        userStats = await UserStats.findOne({ user: userId })
          .populate('achievements')
          .populate({
            path: 'achievements',
            populate: {
              path: 'achievement',
              model: 'Achievement'
            }
          });
      }
    } catch (error) {
      console.error('Error during achievement check:', error);
      // Continue without achievement check if it fails
    }

    let allAchievements = await Achievement.find({ isActive: true }).lean();
    if (!allAchievements || allAchievements.length === 0) {
      allAchievements = await Achievement.insertMany(DEFAULT_ACHIEVEMENTS);
    }

    const profileStatus = checkProfileComplete(userDoc);
    
    const achievementsWithProgress = allAchievements.map(achievement => {
      try {
        const userAchievement = userStats.achievements && userStats.achievements.find(
          ua => ua.achievement && (ua.achievement._id ? ua.achievement._id.toString() : ua.achievement.toString()) === achievement._id.toString()
        );
        
        let progress = 0;
        let earned = false;

        if (userAchievement) {
          progress = userAchievement.progress || achievement.condition.target;
          earned = true;
        } else {
          switch (achievement.condition.type) {
            case 'profile_complete':
              progress = profileStatus;
              break;
            case 'messages_sent':
              progress = userStats.totalMessagesSent || 0;
              break;
            case 'login_streak':
              progress = userStats.loginStreak || 0;
              break;
            case 'referrals':
              progress = userStats.totalReferrals || 0;
              break;
            case 'gifts_sent':
              progress = userStats.totalGiftsSent || 0;
              break;
            case 'gifts_received':
              progress = userStats.totalGiftsReceived || 0;
              break;
            case 'daily_gift_sender':
              progress = userStats.dailyGiftsSent || 0;
              break;
            case 'events_attended':
              progress = userStats.totalEventsAttended || 0;
              break;
            default:
              progress = 0;
          }
        }

        return {
          ...achievement,
          progress: Math.min(progress, achievement.condition.target),
          earned,
          target: achievement.condition.target
        };
      } catch (error) {
        console.error('Error processing achievement:', achievement.name, error);
        return {
          ...achievement,
          progress: 0,
          earned: false,
          target: achievement.condition.target
        };
      }
    });

    res.json({
      stats: userStats,
      achievements: achievementsWithProgress
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ message: 'Failed to fetch user stats' });
  }
};

// @desc    Update daily login streak
// @route   POST /api/achievements/check-in
// @access  Private
exports.dailyCheckIn = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let userStats = await UserStats.findOne({ user: userId });

    if (!userStats) {
      userStats = new UserStats({ user: userId });
    }

    let alreadyCheckedIn = false;
    if (userStats.lastLoginDate) {
      const lastLogin = new Date(userStats.lastLoginDate);
      lastLogin.setHours(0, 0, 0, 0);
      
      if (lastLogin.getTime() === today.getTime()) {
        alreadyCheckedIn = true;
      } else {
        const diffTime = today - lastLogin;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          userStats.loginStreak += 1;
        } else if (diffDays > 1) {
          userStats.loginStreak = 1;
        }
      }
    } else {
      userStats.loginStreak = 1;
    }

    if (!alreadyCheckedIn) {
      userStats.lastLoginDate = today;
      userStats.points += 10;
      await userStats.save();

      try {
        await addReward(userId, 10, 'Daily check-in bonus', 'daily_checkin', null);
      } catch (error) {
        console.error('Error adding check-in reward:', error);
      }
    }

    await checkAchievements(userId, userStats);

    res.json({
      message: alreadyCheckedIn ? 'Already checked in today' : 'Check-in successful',
      streak: userStats.loginStreak,
      points: userStats.points,
      bonusEarned: alreadyCheckedIn ? 0 : 10
    });
  } catch (error) {
    console.error('Error during check-in:', error);
    res.status(500).json({ message: 'Failed to check in' });
  }
};

// Helper function to check and award achievements
async function checkAchievements(userId, userStats, userDoc = null) {
  try {
    if (!userStats) {
      userStats = await UserStats.findOne({ user: userId });
      if (!userStats) {
        userStats = new UserStats({ user: userId });
      }
    }

    if (!userDoc) {
      userDoc = await User.findById(userId).lean();
    }

    const [achievements, existingUserAchievements] = await Promise.all([
      Achievement.find({ isActive: true }).lean(),
      UserAchievement.find({ user: userId }).select('achievement').lean()
    ]);

    const earnedSet = new Set(existingUserAchievements.map(ua => ua.achievement.toString()));
    const profileComplete = checkProfileComplete(userDoc);
    
    for (const achievement of achievements) {
      if (earnedSet.has(achievement._id.toString())) continue;

      let progress = 0;
      let earned = false;

      switch (achievement.condition.type) {
        case 'profile_complete':
          progress = profileComplete;
          if (progress >= achievement.condition.target) earned = true;
          break;
        case 'login_streak':
          progress = userStats.loginStreak || 0;
          if (progress >= achievement.condition.target) earned = true;
          break;
        case 'messages_sent':
          progress = userStats.totalMessagesSent || 0;
          if (progress >= achievement.condition.target) earned = true;
          break;
        case 'referrals':
          progress = userStats.totalReferrals || 0;
          if (progress >= achievement.condition.target) earned = true;
          break;
        case 'gifts_sent':
          progress = userStats.totalGiftsSent || 0;
          if (progress >= achievement.condition.target) earned = true;
          break;
        case 'gifts_received':
          progress = userStats.totalGiftsReceived || 0;
          if (progress >= achievement.condition.target) earned = true;
          break;
        case 'daily_gift_sender':
          progress = userStats.dailyGiftsSent || 0;
          if (progress >= achievement.condition.target) earned = true;
          break;
        case 'events_attended':
          progress = userStats.totalEventsAttended || 0;
          if (progress >= achievement.condition.target) earned = true;
          break;
      }

      if (earned) {
        const userAchievement = await UserAchievement.create({
          user: userId,
          achievement: achievement._id,
          progress: achievement.condition.target
        });

        userStats.achievements.push(userAchievement._id);
        userStats.points += achievement.points;
        
        if (achievement.points > 0) {
          try {
            await addReward(userId, achievement.points, `Achievement: ${achievement.name}`, 'achievement', achievement._id);
          } catch (error) {
            console.error('Error adding wallet reward:', error);
          }
        }
        
        if (achievement.reward && achievement.reward.freePremiumDays > 0) {
          if (userDoc) {
            const currentExpiry = (userDoc.premiumExpiresAt && new Date(userDoc.premiumExpiresAt) > new Date()) 
              ? new Date(userDoc.premiumExpiresAt) 
              : new Date();
            await User.findByIdAndUpdate(userId, {
              premiumExpiresAt: new Date(currentExpiry.getTime() + achievement.reward.freePremiumDays * 24 * 60 * 60 * 1000),
              isPremium: true,
              premiumPlan: userDoc.premiumPlan || 'bronze'
            });
          }
        }

        // Create achievement notification
        await Notification.create({
          user: userId,
          type: 'achievement',
          message: `🏆 Achievement Unlocked: "${achievement.name}"! You earned ${achievement.points} points!`
        });

        await userStats.save();
      }
    }
  } catch (error) {
    console.error('Error checking achievements:', error);
  }
}

exports.checkAchievements = checkAchievements;

// @desc    Create achievement (admin only)
// @route   POST /api/achievements/admin
// @access  Private/Admin
exports.createAchievement = async (req, res) => {
  try {
    const achievement = await Achievement.create(req.body);
    res.status(201).json(achievement);
  } catch (error) {
    console.error('Error creating achievement:', error);
    res.status(500).json({ message: 'Failed to create achievement' });
  }
};

// @desc    Update achievement (admin only)
// @route   PUT /api/achievements/admin/:id
// @access  Private/Admin
exports.updateAchievement = async (req, res) => {
  try {
    const achievement = await Achievement.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!achievement) {
      return res.status(404).json({ message: 'Achievement not found' });
    }
    res.json(achievement);
  } catch (error) {
    console.error('Error updating achievement:', error);
    res.status(500).json({ message: 'Failed to update achievement' });
  }
};

// @desc    Delete achievement (admin only)
// @route   DELETE /api/achievements/admin/:id
// @access  Private/Admin
exports.deleteAchievement = async (req, res) => {
  try {
    const achievement = await Achievement.findByIdAndDelete(req.params.id);
    if (!achievement) {
      return res.status(404).json({ message: 'Achievement not found' });
    }
    res.json({ message: 'Achievement deleted successfully' });
  } catch (error) {
    console.error('Error deleting achievement:', error);
    res.status(500).json({ message: 'Failed to delete achievement' });
  }
};
