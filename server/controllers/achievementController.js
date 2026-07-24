const { Achievement, UserAchievement, UserStats } = require('../models/Achievement');
const { addReward } = require('./walletController');
const User = require('../models/User');

// @desc    Get all achievements
// @route   GET /api/achievements
// @access  Private
exports.getAchievements = async (req, res) => {
  try {
    const achievements = await Achievement.find({ isActive: true }).sort({ category: 1, points: -1 });
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

    // Get all available achievements
    const allAchievements = await Achievement.find({ isActive: true });
    
    // Calculate progress for each achievement
    const achievementsWithProgress = allAchievements.map(achievement => {
      const userAchievement = userStats.achievements.find(
        ua => ua.achievement && ua.achievement.toString() === achievement._id.toString()
      );
      
      let progress = 0;
      let earned = false;

      if (userAchievement) {
        progress = userAchievement.progress;
        earned = true;
      } else {
        // Calculate current progress based on user stats
        switch (achievement.condition.type) {
          case 'profile_complete':
            const user = User.findById(userId);
            progress = 0; // Would need to calculate based on profile completion
            break;
          case 'messages_sent':
            progress = userStats.totalMessagesSent;
            break;
          case 'login_streak':
            progress = userStats.loginStreak;
            break;
          case 'referrals':
            progress = userStats.totalReferrals;
            break;
          case 'gifts_sent':
            progress = userStats.totalGiftsSent;
            break;
          case 'events_attended':
            progress = userStats.totalEventsAttended;
            break;
          default:
            progress = 0;
        }
      }

      return {
        ...achievement.toObject(),
        progress,
        earned,
        target: achievement.condition.target
      };
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

    // Check if already checked in today
    if (userStats.lastLoginDate) {
      const lastLogin = new Date(userStats.lastLoginDate);
      lastLogin.setHours(0, 0, 0, 0);
      
      if (lastLogin.getTime() === today.getTime()) {
        return res.json({ 
          message: 'Already checked in today',
          streak: userStats.loginStreak,
          points: userStats.points
        });
      }

      // Check if consecutive day
      const diffTime = today - lastLogin;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        userStats.loginStreak += 1;
      } else if (diffDays > 1) {
        userStats.loginStreak = 1; // Reset streak
      }
    } else {
      userStats.loginStreak = 1;
    }

    userStats.lastLoginDate = today;
    userStats.points += 10; // Daily check-in bonus

    await userStats.save();

    // Add wallet reward for daily check-in
    try {
      await addReward(userId, 10, 'Daily check-in bonus', 'daily_checkin', null);
    } catch (error) {
      console.error('Error adding check-in reward:', error);
    }

    // Check for streak achievements
    await checkAchievements(userId, userStats);

    res.json({
      message: 'Check-in successful',
      streak: userStats.loginStreak,
      points: userStats.points,
      bonusEarned: 10
    });
  } catch (error) {
    console.error('Error during check-in:', error);
    res.status(500).json({ message: 'Failed to check in' });
  }
};

// Helper function to check and award achievements
async function checkAchievements(userId, userStats) {
  const achievements = await Achievement.find({ isActive: true });
  
  for (const achievement of achievements) {
    // Check if already earned
    const existing = await UserAchievement.findOne({
      user: userId,
      achievement: achievement._id
    });
    
    if (existing) continue;

    let progress = 0;
    let earned = false;

    switch (achievement.condition.type) {
      case 'login_streak':
        if (userStats.loginStreak >= achievement.condition.target) {
          earned = true;
        }
        progress = userStats.loginStreak;
        break;
      case 'messages_sent':
        if (userStats.totalMessagesSent >= achievement.condition.target) {
          earned = true;
        }
        progress = userStats.totalMessagesSent;
        break;
      case 'referrals':
        if (userStats.totalReferrals >= achievement.condition.target) {
          earned = true;
        }
        progress = userStats.totalReferrals;
        break;
      case 'gifts_sent':
        if (userStats.totalGiftsSent >= achievement.condition.target) {
          earned = true;
        }
        progress = userStats.totalGiftsSent;
        break;
      case 'gifts_received':
        if (userStats.totalGiftsReceived >= achievement.condition.target) {
          earned = true;
        }
        progress = userStats.totalGiftsReceived;
        break;
      case 'daily_gift_sender':
        // Check if sent gifts today (need to track daily gifts)
        progress = userStats.dailyGiftsSent || 0;
        if (progress >= achievement.condition.target) {
          earned = true;
        }
        break;
      case 'events_attended':
        if (userStats.totalEventsAttended >= achievement.condition.target) {
          earned = true;
        }
        progress = userStats.totalEventsAttended;
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
      
      // Add wallet reward for achievement
      if (achievement.points > 0) {
        try {
          await addReward(userId, achievement.points, `Achievement reward: ${achievement.name}`, 'achievement', achievement._id);
        } catch (error) {
          console.error('Error adding wallet reward:', error);
        }
      }
      
      // Award free premium if achievement has premium reward
      if (achievement.reward && achievement.reward.freePremiumDays) {
        const user = await User.findById(userId);
        if (user) {
          const premiumExpiry = user.premiumExpiry ? new Date(user.premiumExpiry) : new Date();
          const now = new Date();
          const expiryDate = premiumExpiry > now ? premiumExpiry : now;
          expiryDate.setDate(expiryDate.getDate() + achievement.reward.freePremiumDays);
          user.premiumExpiry = expiryDate;
          user.isPremium = true;
          await user.save();
        }
      }
      
      await userStats.save();
    }
  }
}

// Export helper function for use in other controllers
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
    const achievement = await Achievement.findByIdAndUpdate(req.params.id, req.body, { new: true });
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
