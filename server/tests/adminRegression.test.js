const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Message = require('../models/Message');
const User = require('../models/User');
const SupportTicket = require('../models/SupportTicket');
const { RedemptionConfig } = require('../models/Redemption');
const { Achievement } = require('../models/Achievement');
const SuccessStory = require('../models/SuccessStory');
const messageController = require('../controllers/messageController');
const supportController = require('../controllers/supportController');
const redemptionController = require('../controllers/redemptionController');
const achievementController = require('../controllers/achievementController');
const successStoryController = require('../controllers/successStoryController');
const { FREE_RETENTION_MS, PREMIUM_RETENTION_MS } = require('../utils/messageCleanup');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('1. Message Expiration & Retention System', () => {
  test('Free conversation receives 36h expiry and Premium receives 48h expiry', async () => {
    const freeSender = await User.create({
      name: 'Free User 1',
      email: 'free1@example.com',
      password: 'password123',
      gender: 'male',
      role: 'user',
      isPremium: false,
    });

    const freeRecipient = await User.create({
      name: 'Free User 2',
      email: 'free2@example.com',
      password: 'password123',
      gender: 'female',
      role: 'user',
      isPremium: false,
    });

    const premiumUser = await User.create({
      name: 'Premium User',
      email: 'premium@example.com',
      password: 'password123',
      gender: 'male',
      role: 'user',
      isPremium: true,
      premiumPlan: 'gold',
      premiumExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    // Test free message sending
    const reqFree = {
      user: freeSender,
      body: { to: freeRecipient._id.toString(), content: 'Hello Free User' },
    };
    let resFreeData = null;
    const resFree = {
      status: () => ({
        json: (data) => {
          resFreeData = data;
        },
      }),
      json: (data) => {
        resFreeData = data;
      },
    };
    await messageController.sendMessage(reqFree, resFree);
    expect(resFreeData).toBeDefined();
    expect(resFreeData.retentionHours).toBe(36);
    const freeExpiryDiff = new Date(resFreeData.expiresAt).getTime() - Date.now();
    expect(Math.abs(freeExpiryDiff - FREE_RETENTION_MS)).toBeLessThan(5000);

    // Test premium message sending
    const reqPrem = {
      user: premiumUser,
      body: { to: freeRecipient._id.toString(), content: 'Hello from Premium User' },
    };
    let resPremData = null;
    const resPrem = {
      status: () => ({
        json: (data) => {
          resPremData = data;
        },
      }),
      json: (data) => {
        resPremData = data;
      },
    };
    await messageController.sendMessage(reqPrem, resPrem);
    expect(resPremData).toBeDefined();
    expect(resPremData.retentionHours).toBe(48);
    const premExpiryDiff = new Date(resPremData.expiresAt).getTime() - Date.now();
    expect(Math.abs(premExpiryDiff - PREMIUM_RETENTION_MS)).toBeLessThan(5000);
  });

  test('getConversations immediately excludes expired messages', async () => {
    const userA = await User.create({
      name: 'User A',
      email: 'usera@example.com',
      password: 'password123',
      gender: 'male',
    });
    const userB = await User.create({
      name: 'User B',
      email: 'userb@example.com',
      password: 'password123',
      gender: 'female',
    });

    // Create an expired message
    await Message.create({
      from: userA._id,
      to: userB._id,
      content: 'expired_content',
      expiresAt: new Date(Date.now() - 10000), // Expired 10 seconds ago
    });

    // Create a valid active message
    await Message.create({
      from: userA._id,
      to: userB._id,
      content: 'active_content',
      expiresAt: new Date(Date.now() + 36 * 60 * 60 * 1000),
    });

    let convos = null;
    const req = { user: userB };
    const res = {
      json: (data) => {
        convos = data;
      },
    };

    await messageController.getConversations(req, res);
    expect(convos).toHaveLength(1);
    expect(convos[0].lastMessage.content).toBe('active_content');
  });
});

describe('2. Support Ticket Resolution & Notification Tracking', () => {
  test('Resolving a ticket persists resolvedAt and resolvedBy in MongoDB', async () => {
    const adminUser = await User.create({
      name: 'Support Admin',
      email: 'admin_support@example.com',
      password: 'password123',
      gender: 'other',
      role: 'admin',
    });

    const ticket = await SupportTicket.create({
      category: 'technical',
      subject: 'Issue with profile update',
      status: 'open',
      priority: 'high',
      messages: [{ sender: 'user', text: 'Please help with profile photo.' }],
    });

    let updatedTicket = null;
    const req = {
      params: { id: ticket._id.toString() },
      body: { status: 'resolved', adminNotes: 'Fixed by updating photo.' },
      user: adminUser,
    };
    const res = {
      json: (data) => {
        updatedTicket = data.ticket;
      },
    };

    await supportController.updateTicketStatus(req, res);
    expect(updatedTicket).toBeDefined();
    expect(updatedTicket.status).toBe('resolved');
    expect(updatedTicket.resolvedAt).toBeDefined();
    expect(updatedTicket.resolvedBy.toString()).toBe(adminUser._id.toString());

    // Verify persisted in DB after query
    const dbTicket = await SupportTicket.findById(ticket._id);
    expect(dbTicket.status).toBe('resolved');
    expect(dbTicket.resolvedAt).toBeDefined();
    expect(dbTicket.resolvedBy.toString()).toBe(adminUser._id.toString());
  });
});

describe('3. Redemption Configs Management CRUD', () => {
  test('Allows creating multiple configs with same rewardType (no duplicate key error)', async () => {
    const config1 = await RedemptionConfig.create({
      rewardType: 'premium',
      rewardName: '1-Day Premium Membership',
      pointsCost: 150,
      isActive: true,
    });

    const config2 = await RedemptionConfig.create({
      rewardType: 'premium',
      rewardName: '7-Day Premium Membership',
      pointsCost: 450,
      isActive: true,
    });

    expect(config1._id).toBeDefined();
    expect(config2._id).toBeDefined();
    expect(config1.rewardType).toBe('premium');
    expect(config2.rewardType).toBe('premium');

    // Update config1
    let updateRes = null;
    const reqUpdate = {
      params: { id: config1._id.toString() },
      body: { pointsCost: 180, isActive: false },
    };
    const resUpdate = {
      json: (data) => {
        updateRes = data;
      },
    };
    await redemptionController.updateRedemptionConfig(reqUpdate, resUpdate);
    expect(updateRes.pointsCost).toBe(180);
    expect(updateRes.isActive).toBe(false);

    // Delete config2
    let deleteRes = null;
    const reqDelete = { params: { id: config2._id.toString() } };
    const resDelete = {
      json: (data) => {
        deleteRes = data;
      },
    };
    await redemptionController.deleteRedemptionConfig(reqDelete, resDelete);
    expect(deleteRes.message).toContain('deleted');

    const remaining = await RedemptionConfig.findById(config2._id);
    expect(remaining).toBeNull();
  });
});

describe('4. Achievements Management CRUD', () => {
  test('Allows adding, editing, toggling and deleting achievements', async () => {
    let created = null;
    const reqCreate = {
      body: {
        name: 'Master Matchmaker',
        description: 'Sent 100 messages to matches',
        icon: '🎯',
        category: 'messaging',
        points: 50,
        rarity: 'gold',
        condition: { type: 'messages_sent', target: 100 },
        isActive: true,
      },
    };
    const resCreate = {
      status: () => ({
        json: (data) => {
          created = data;
        },
      }),
      json: (data) => {
        created = data;
      },
    };
    await achievementController.createAchievement(reqCreate, resCreate);
    expect(created._id).toBeDefined();
    expect(created.name).toBe('Master Matchmaker');

    // Edit
    let updated = null;
    const reqEdit = {
      params: { id: created._id.toString() },
      body: { points: 75, isActive: false },
    };
    const resEdit = {
      json: (data) => {
        updated = data;
      },
    };
    await achievementController.updateAchievement(reqEdit, resEdit);
    expect(updated.points).toBe(75);
    expect(updated.isActive).toBe(false);

    // Get all admin achievements
    let allAdmin = null;
    const reqAll = {};
    const resAll = {
      json: (data) => {
        allAdmin = data;
      },
    };
    await achievementController.getAdminAchievements(reqAll, resAll);
    expect(allAdmin.some((a) => a.name === 'Master Matchmaker')).toBe(true);

    // Delete
    const reqDel = { params: { id: created._id.toString() } };
    const resDel = {
      json: () => {},
    };
    await achievementController.deleteAchievement(reqDel, resDel);
    const deletedDoc = await Achievement.findById(created._id);
    expect(deletedDoc).toBeNull();
  });
});

describe('5. Success Stories Management Status Synchronization', () => {
  test('Approving story updates isApproved to true and preserves isFeatured', async () => {
    const admin = await User.create({
      name: 'Story Admin',
      email: 'story_admin@example.com',
      password: 'password123',
      gender: 'female',
      role: 'admin',
    });

    const story = await SuccessStory.create({
      coupleName: 'Tharindu & Dilini',
      story: 'We met on Kapu LK and got married in 2024!',
      weddingDate: new Date('2024-10-05'),
      submittedBy: admin._id,
      isApproved: false,
      isFeatured: true, // Featured while pending
    });

    let approvedRes = null;
    const req = { params: { id: story._id.toString() } };
    const res = {
      json: (data) => {
        approvedRes = data;
      },
    };

    await successStoryController.approveSuccessStory(req, res);
    expect(approvedRes).toBeDefined();
    expect(approvedRes.isApproved).toBe(true);
    expect(approvedRes.isFeatured).toBe(true); // isFeatured preserved!

    // Verify in DB
    const dbStory = await SuccessStory.findById(story._id);
    expect(dbStory.isApproved).toBe(true);
    expect(dbStory.isFeatured).toBe(true);
  });
});
