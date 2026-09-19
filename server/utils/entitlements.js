const User = require('../models/User');

/**
 * Plan definitions and feature mappings
 */
const PLAN_DURATIONS = {
  bronze: 10,
  silver: 21,
  gold: 60,
};

const PLAN_FEATURES = {
  bronze: [
    'unlimited_messages',
    'profile_boost',
    'badge',
    'ad_free',
  ],
  silver: [
    'unlimited_messages',
    'profile_boost',
    'priority_matching',
    'direct_contact_info',
    'badge',
    'profile_visitors',
    'ad_free',
  ],
  gold: [
    'unlimited_messages',
    'profile_boost',
    'priority_matching',
    'highest_priority_matching',
    'direct_contact_info',
    'badge',
    'vip_spotlight',
    'profile_visitors',
    'ad_free',
    'priority_support',
  ],
};

/**
 * Returns comprehensive derived premium status for a user.
 * @param {Object} user 
 * @returns {Object}
 */
const getUserPremiumDetails = (user) => {
  if (!user) {
    return {
      isPremium: false,
      premiumPlan: null,
      premiumStatus: 'none',
      premiumStartedAt: null,
      premiumExpiresAt: null,
      daysRemaining: 0,
      features: [],
    };
  }

  // Admins are granted full access
  if (user.role === 'admin') {
    return {
      isPremium: true,
      premiumPlan: 'gold',
      premiumStatus: 'active',
      premiumStartedAt: user.premiumStartedAt || user.createdAt,
      premiumExpiresAt: null,
      daysRemaining: 9999,
      features: PLAN_FEATURES.gold,
      isAdmin: true,
    };
  }

  const plan = (user.premiumPlan || '').toString().toLowerCase();
  const now = new Date();
  const expiresAt = user.premiumExpiresAt ? new Date(user.premiumExpiresAt) : null;
  const startedAt = user.premiumStartedAt || user.premiumSince || null;

  // Check if expired or not active
  const hasExpiry = expiresAt !== null;
  const isExpired = hasExpiry && now >= expiresAt;
  const isValidPlan = ['bronze', 'silver', 'gold'].includes(plan);

  if (!user.isPremium || !isValidPlan || isExpired) {
    const wasEverPremium = hasExpiry || isValidPlan || user.premiumStatus === 'expired';
    return {
      isPremium: false,
      premiumPlan: null,
      previousPlan: isValidPlan ? plan : null,
      premiumStatus: wasEverPremium ? 'expired' : 'none',
      premiumStartedAt: startedAt,
      premiumExpiresAt: expiresAt,
      daysRemaining: 0,
      features: [],
    };
  }

  // Active premium user
  const diffMs = expiresAt.getTime() - now.getTime();
  const daysRemaining = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  return {
    isPremium: true,
    premiumPlan: plan,
    premiumStatus: 'active',
    premiumStartedAt: startedAt,
    premiumExpiresAt: expiresAt,
    daysRemaining,
    features: PLAN_FEATURES[plan] || [],
  };
};

/**
 * Centralized feature entitlement check.
 * Reusable throughout messaging, profiles, search, visitors, support, etc.
 * @param {Object} user 
 * @param {string} feature 
 * @returns {boolean}
 */
const hasPremiumFeature = (user, feature) => {
  if (!user) return false;
  if (user.role === 'admin') return true;

  const details = getUserPremiumDetails(user);
  if (!details.isPremium) return false;

  return details.features.includes(feature);
};

/**
 * Checks and automatically synchronizes user premium state in the database if expired.
 * Ensures expired users automatically behave as Free users everywhere.
 * @param {Object} userDoc 
 * @returns {Promise<Object>} Updated user object
 */
const syncUserPremiumStatus = async (userDoc) => {
  if (!userDoc) return null;

  if (userDoc.role === 'admin') return userDoc;

  const now = new Date();
  const expiresAt = userDoc.premiumExpiresAt ? new Date(userDoc.premiumExpiresAt) : null;

  // If marked premium but has no expiry date or already expired:
  if (userDoc.isPremium && expiresAt && now >= expiresAt) {
    userDoc.isPremium = false;
    userDoc.premiumPlan = null;
    userDoc.premiumStatus = 'expired';
    userDoc.premiumExpirySentNotification = false;

    try {
      if (typeof userDoc.save === 'function') {
        await userDoc.save();
      } else if (userDoc._id) {
        await User.updateOne(
          { _id: userDoc._id },
          {
            $set: {
              isPremium: false,
              premiumPlan: null,
              premiumStatus: 'expired',
              premiumExpirySentNotification: false,
            },
          }
        );
      }
    } catch (err) {
      console.error('[Entitlements] Failed to sync expired user:', err.message);
    }
  }

  return userDoc;
};

module.exports = {
  PLAN_DURATIONS,
  PLAN_FEATURES,
  getUserPremiumDetails,
  hasPremiumFeature,
  syncUserPremiumStatus,
};
