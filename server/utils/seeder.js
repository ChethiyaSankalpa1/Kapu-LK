const User = require('../models/User');
const { Achievement } = require('../models/Achievement');
const { Gift } = require('../models/Gift');

const seedUsers = async () => {
  try {
    // Check for admin
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      await User.create({
        name: 'System Admin',
        username: 'admin',
        email: 'admin@matrimony.com',
        password: 'admin123', // Will be hashed by pre-save hook
        role: 'admin',
        isApproved: true,
        isActive: true,
      });
      console.log('✅ Default Admin Created: admin@matrimony.com / admin123');
    }

    // Check for default user
    const userExists = await User.findOne({ email: 'user@matrimony.com' });
    if (!userExists) {
      await User.create({
        name: 'Demo User',
        username: 'demouser',
        email: 'user@matrimony.com',
        password: 'user123', // Will be hashed by pre-save hook
        role: 'user',
        isApproved: true,
        isActive: true,
        gender: 'male',
        age: 30,
        bio: 'I am a demo user for testing purposes.',
        location: 'Colombo, Sri Lanka'
      });
      console.log('✅ Default User Created: user@matrimony.com / user123');
    }
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
  }
};

const seedAchievements = async () => {
  try {
    const achievements = [
      {
        name: 'First Steps',
        description: 'Complete your profile for the first time',
        icon: '👤',
        category: 'profile',
        points: 50,
        rarity: 'bronze',
        condition: { type: 'profile_complete', target: 1 },
        reward: { freePremiumDays: 0, bonusPoints: 0 }
      },
      {
        name: 'Conversation Starter',
        description: 'Send 50 messages to other users',
        icon: '💬',
        category: 'messaging',
        points: 100,
        rarity: 'bronze',
        condition: { type: 'messages_sent', target: 50 },
        reward: { freePremiumDays: 0, bonusPoints: 0 }
      },
      {
        name: 'Social Butterfly',
        description: 'Send 200 messages to other users',
        icon: '🦋',
        category: 'messaging',
        points: 300,
        rarity: 'silver',
        condition: { type: 'messages_sent', target: 200 },
        reward: { freePremiumDays: 0, bonusPoints: 0 }
      },
      {
        name: 'Chat Master',
        description: 'Send 500 messages to other users',
        icon: '🎯',
        category: 'messaging',
        points: 500,
        rarity: 'gold',
        condition: { type: 'messages_sent', target: 500 },
        reward: { freePremiumDays: 7, bonusPoints: 0 }
      },
      {
        name: 'Week Warrior',
        description: 'Maintain a 7-day login streak',
        icon: '🔥',
        category: 'engagement',
        points: 100,
        rarity: 'bronze',
        condition: { type: 'login_streak', target: 7 },
        reward: { freePremiumDays: 0, bonusPoints: 0 }
      },
      {
        name: 'Month Champion',
        description: 'Maintain a 30-day login streak',
        icon: '🏆',
        category: 'engagement',
        points: 500,
        rarity: 'gold',
        condition: { type: 'login_streak', target: 30 },
        reward: { freePremiumDays: 14, bonusPoints: 0 }
      },
      {
        name: 'First Referral',
        description: 'Refer your first friend to the platform',
        icon: '👥',
        category: 'social',
        points: 200,
        rarity: 'bronze',
        condition: { type: 'referrals', target: 1 },
        reward: { freePremiumDays: 3, bonusPoints: 0 }
      },
      {
        name: 'Network Builder',
        description: 'Refer 5 friends to the platform',
        icon: '🌟',
        category: 'social',
        points: 1000,
        rarity: 'platinum',
        condition: { type: 'referrals', target: 5 },
        reward: { freePremiumDays: 30, bonusPoints: 0 }
      },
      {
        name: 'Generous Gifter',
        description: 'Send 10 gifts to other users',
        icon: '🎁',
        category: 'engagement',
        points: 150,
        rarity: 'bronze',
        condition: { type: 'gifts_sent', target: 10 },
        reward: { freePremiumDays: 0, bonusPoints: 0 }
      },
      {
        name: 'Gift Master',
        description: 'Send 50 gifts to other users',
        icon: '💎',
        category: 'engagement',
        points: 500,
        rarity: 'gold',
        condition: { type: 'gifts_sent', target: 50 },
        reward: { freePremiumDays: 7, bonusPoints: 0 }
      },
      {
        name: 'Popular',
        description: 'Receive 20 gifts from other users',
        icon: '❤️',
        category: 'social',
        points: 200,
        rarity: 'silver',
        condition: { type: 'gifts_received', target: 20 },
        reward: { freePremiumDays: 0, bonusPoints: 0 }
      },
      {
        name: 'Daily Gifter',
        description: 'Send 5 gifts in a single day',
        icon: '🎊',
        category: 'engagement',
        points: 100,
        rarity: 'bronze',
        condition: { type: 'daily_gift_sender', target: 5 },
        reward: { freePremiumDays: 0, bonusPoints: 0 }
      },
      {
        name: 'Event Goer',
        description: 'Attend 3 events',
        icon: '🎉',
        category: 'engagement',
        points: 150,
        rarity: 'bronze',
        condition: { type: 'events_attended', target: 3 },
        reward: { freePremiumDays: 0, bonusPoints: 0 }
      },
      {
        name: 'Social Star',
        description: 'Attend 10 events',
        icon: '⭐',
        category: 'engagement',
        points: 500,
        rarity: 'gold',
        condition: { type: 'events_attended', target: 10 },
        reward: { freePremiumDays: 14, bonusPoints: 0 }
      }
    ];

    for (const achievement of achievements) {
      const exists = await Achievement.findOne({ name: achievement.name });
      if (!exists) {
        await Achievement.create(achievement);
        console.log(`✅ Achievement Created: ${achievement.name}`);
      }
    }
  } catch (error) {
    console.error('❌ Achievement seeding error:', error.message);
  }
};

const seedGifts = async () => {
  try {
    const gifts = [
      {
        name: 'Rose',
        emoji: '🌹',
        category: 'flowers',
        price: 100,
        currency: 'LKR',
        isPremium: false,
        isRecommended: true,
        isActive: true
      },
      {
        name: 'Heart',
        emoji: '❤️',
        category: 'hearts',
        price: 150,
        currency: 'LKR',
        isPremium: false,
        isRecommended: true,
        isActive: true
      },
      {
        name: 'Teddy Bear',
        emoji: '🧸',
        category: 'gifts',
        price: 250,
        currency: 'LKR',
        isPremium: false,
        isRecommended: false,
        isActive: true
      },
      {
        name: 'Chocolate',
        emoji: '🍫',
        category: 'food',
        price: 200,
        currency: 'LKR',
        isPremium: false,
        isRecommended: false,
        isActive: true
      },
      {
        name: 'Diamond Ring',
        emoji: '💍',
        category: 'special',
        price: 1000,
        currency: 'LKR',
        isPremium: true,
        isRecommended: true,
        isActive: true
      },
      {
        name: 'Bouquet',
        emoji: '💐',
        category: 'flowers',
        price: 500,
        currency: 'LKR',
        isPremium: false,
        isRecommended: false,
        isActive: true
      },
      {
        name: 'Love Letter',
        emoji: '💌',
        category: 'gifts',
        price: 300,
        currency: 'LKR',
        isPremium: false,
        isRecommended: false,
        isActive: true
      },
      {
        name: 'Crown',
        emoji: '👑',
        category: 'special',
        price: 2000,
        currency: 'LKR',
        isPremium: true,
        isRecommended: false,
        isActive: true
      }
    ];

    for (const gift of gifts) {
      const exists = await Gift.findOne({ name: gift.name });
      if (!exists) {
        await Gift.create(gift);
        console.log(`✅ Gift Created: ${gift.name} - ${gift.price} ${gift.currency}`);
      }
    }
  } catch (error) {
    console.error('❌ Gift seeding error:', error.message);
  }
};

const seedPremiumPlans = async () => {
  try {
    const PremiumPlan = require('../models/PremiumPlan');
    const plans = [
      {
        name: 'Bronze Plan',
        badge: 'bronze',
        price: 500,
        currency: 'LKR',
        durationDays: 7,
        description: 'Essential 7-day premium pass for quick matching',
        features: ['7 Days Full Access', 'Unlimited Messages', 'Profile Boost', 'Bronze Badge', 'Ad-Free Experience'],
        isPopular: false,
        isActive: true,
      },
      {
        name: 'Silver Plan',
        badge: 'silver',
        price: 800,
        currency: 'LKR',
        durationDays: 14,
        description: 'Popular 14-day plan with priority matching',
        features: ['14 Days Full Access', 'Unlimited Messages', 'Priority Matching', 'Direct Contact Info', 'Silver Badge', 'Profile Visitors List'],
        isPopular: true,
        isActive: true,
      },
      {
        name: 'Gold Plan',
        badge: 'gold',
        price: 1000,
        currency: 'LKR',
        durationDays: 28,
        description: 'Ultimate 28-day VIP pass for serious matchmaking',
        features: ['28 Days Full Access', 'VIP Spotlighting', 'Unlimited Messaging', 'Direct Contact Info', 'Gold Badge', '24/7 Priority Support'],
        isPopular: false,
        isActive: true,
      },
    ];

    for (const plan of plans) {
      const exists = await PremiumPlan.findOne({ badge: plan.badge });
      if (!exists) {
        await PremiumPlan.create(plan);
        console.log(`✅ Premium Plan Created: ${plan.name} - ${plan.price} ${plan.currency} (${plan.durationDays} Days)`);
      }
    }
  } catch (error) {
    console.error('❌ Premium Plan seeding error:', error.message);
  }
};

module.exports = { seedUsers, seedAchievements, seedGifts, seedPremiumPlans };

