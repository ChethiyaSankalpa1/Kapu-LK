const assert = require('assert');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../models/User');
const Notification = require('../models/Notification');
const {
  getInactivityStatus,
  runInactivityChecks,
} = require('../services/inactivityCleanupService');

jest.setTimeout(60000);

describe('10-day inactivity retention engine', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Notification.deleteMany({});
  });

  test('classifies 4, 5-7, 8, 9, and 10+ days from lastActiveAt and avoids duplicate warnings', async () => {
    const now = Date.now();
    const users = {};
    for (const days of [4, 5, 7, 8, 9, 10]) {
      users[days] = await User.create({
        name: `Inactivity ${days}`,
        email: `inactivity-${days}@example.com`,
        password: 'password123',
        lastActiveAt: new Date(now - days * 24 * 60 * 60 * 1000),
        isApproved: true,
      });
    }

    const status = await getInactivityStatus();
    assert.strictEqual(status.warning5dCount, 2);
    assert.strictEqual(status.warning2dCount, 1);
    assert.strictEqual(status.warning1dCount, 1);
    assert.strictEqual(status.pendingPurgeCount, 1);
    assert.strictEqual(status.inactiveUsersCount, 5);

    const firstRun = await runInactivityChecks();
    assert.strictEqual(firstRun.warnings5d, 2);
    assert.strictEqual(firstRun.warnings2d, 1);
    assert.strictEqual(firstRun.warnings1d, 1);
    assert.strictEqual(firstRun.purged, 1);
    assert.strictEqual(await Notification.countDocuments({}), 4);

    const secondRun = await runInactivityChecks();
    assert.strictEqual(secondRun.warnings5d, 0);
    assert.strictEqual(secondRun.warnings2d, 0);
    assert.strictEqual(secondRun.warnings1d, 0);
    assert.strictEqual(secondRun.purged, 0);
    assert.strictEqual(await Notification.countDocuments({}), 4);
    assert.ok(await User.findById(users[4]._id));
    assert.strictEqual(await User.findById(users[10]._id), null);
  });
});