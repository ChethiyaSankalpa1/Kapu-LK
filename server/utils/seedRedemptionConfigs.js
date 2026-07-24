const { RedemptionConfig } = require('../models/Redemption');

const seedRedemptionConfigs = async () => {
  try {
    const count = await RedemptionConfig.countDocuments();
    if (count > 0) {
     console.log('Redemption configs already seeded');
      return;
    }

    const configs = [
      {
        rewardType: 'premium',
        rewardName: 'Premium Membership (1 Month)',
        pointsCost: 500,
        isActive: true,
        metadata: { duration: 30 }
      },
      {
        rewardType: 'premium',
        rewardName: 'Premium Membership (3 Months)',
        pointsCost: 1200,
        isActive: true,
        metadata: { duration: 90 }
      },
      {
        rewardType: 'gift',
        rewardName: 'Free Gift Package',
        pointsCost: 100,
        isActive: true,
        metadata: { giftCount: 3 }
      },
      {
        rewardType: 'boost',
        rewardName: 'Profile Boost (7 Days)',
        pointsCost: 200,
        isActive: true,
        metadata: { duration: 7 }
      },
      {
        rewardType: 'badge',
        rewardName: 'Exclusive Badge',
        pointsCost: 300,
        isActive: true,
        metadata: { badgeType: 'exclusive' }
      }
    ];

    await RedemptionConfig.insertMany(configs);
    console.log('Redemption configs seeded successfully');
  } catch (error) {
    console.error('Error seeding redemption configs:', error);
  }
};

module.exports = { seedRedemptionConfigs };
