const User = require('../models/User');
const Notification = require('../models/Notification');

/**
 * Checks and updates the premium status of a user.
 * Automatically revokes expired subscriptions and sends notifications.
 * @param {Object|string} userOrId 
 * @returns {Promise<Object>} Updated user object
 */
const checkUserPremiumStatus = async (userOrId) => {
  try {
    let user = typeof userOrId === 'string' ? await User.findById(userOrId) : userOrId;
    if (!user) return null;

    if (!user.isPremium || !user.premiumExpiresAt) {
      return user;
    }

    const now = new Date();
    const expiresAt = new Date(user.premiumExpiresAt);

    // If expired
    if (now >= expiresAt) {
      const oldPlan = user.premiumPlan || 'Premium';
      user.isPremium = false;
      user.premiumPlan = null;
      user.premiumExpirySentNotification = false;
      await user.save();

      // Send expired notification
      await Notification.create({
        user: user._id,
        type: 'premium_expired',
        message: `Your ${oldPlan.toUpperCase()} Premium membership has expired. Upgrade today to continue enjoying unlimited features!`,
      });

      console.log(`[PremiumExpiry] Expired premium membership for user ${user._id}`);
      return user;
    }

    // Check if expiring within 2 days (48 hours)
    const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
    if (!user.premiumExpirySentNotification && (expiresAt - now) <= twoDaysMs) {
      user.premiumExpirySentNotification = true;
      await user.save();

      const daysRemaining = Math.max(1, Math.ceil((expiresAt - now) / (24 * 60 * 60 * 1000)));
      await Notification.create({
        user: user._id,
        type: 'premium_expiring',
        message: `Your Premium membership will expire in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}!`,
      });
    }

    return user;
  } catch (error) {
    console.error('Error in checkUserPremiumStatus:', error);
    return null;
  }
};

module.exports = { checkUserPremiumStatus };
