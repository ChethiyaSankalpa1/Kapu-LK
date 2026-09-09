/**
 * Automated Verification Suite for:
 * 1. Inactivity Boolean Query Casting Fix
 * 2. Privacy Consent & 18+ Age Validation
 * 3. Maintenance Mode API & Admin Bypass
 * 4. Feature-Specific Maintenance
 * 5. Coming Soon "Notify Me" Duplicate Prevention
 */

const assert = require('assert');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

// Models & Middleware
const User = require('../models/User');
const PrivacyConsent = require('../models/PrivacyConsent');
const MaintenanceConfig = require('../models/MaintenanceConfig');
const { 
  maintenanceMiddleware, 
  invalidateMaintenanceCache 
} = require('../middleware/maintenanceMiddleware');
const { subscribeComingSoon } = require('../controllers/maintenanceController');

let mongoServer;

async function setupDatabase() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // Enforce the exact Mongoose security flags used in production
  mongoose.set('strictQuery', true);
  mongoose.set('sanitizeFilter', true);

  await mongoose.connect(uri);
  console.log('✅ In-Memory MongoDB connected for verification suite.');
}

async function tearDownDatabase() {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
  console.log('✅ In-Memory MongoDB disconnected.');
}

async function runVerification() {
  console.log('\n======================================================');
  console.log('🚀 KAPU-LK PRIVACY CONSENT & MAINTENANCE TEST SUITE');
  console.log('======================================================\n');

  let passed = 0;
  let total = 0;

  const test = async (name, fn) => {
    total++;
    try {
      await fn();
      console.log(`  ✓ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ FAIL: ${name}`);
      console.error(`    -> ${err.message}`);
      if (err.stack) console.error(err.stack);
    }
  };

  try {
    await setupDatabase();

    // ----------------------------------------------------
    // TEST 1: Inactivity Query Casting Fix under sanitizeFilter
    // ----------------------------------------------------
    await test('Inactivity Boolean query executes without CastError under sanitizeFilter: true', async () => {
      // Create test user
      await User.create({
        name: 'Test Inactive',
        email: 'inactive@test.com',
        password: 'password123',
        age: 25,
        lastActiveAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        inactivityWarningsSent: { d1: false, d2: false, d5: false },
      });

      const threshold1d = new Date(Date.now() - 9 * 24 * 60 * 60 * 1000);
      const thresholdPurge = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);

      // This query previously threw CastError: Cast to Boolean failed for value "{ '$ne': true }"
      const result = await User.find({
        role: mongoose.trusted({ $ne: 'admin' }),
        lastActiveAt: mongoose.trusted({ $lte: threshold1d, $gt: thresholdPurge }),
        'inactivityWarningsSent.d1': mongoose.trusted({ $ne: true }),
      });

      assert(Array.isArray(result), 'Result should be an array');
    });

    // ----------------------------------------------------
    // TEST 2: Privacy Consent Model Creation and Versioning
    // ----------------------------------------------------
    await test('PrivacyConsent model saves and indexes 4 required agreements', async () => {
      const user = await User.create({
        name: 'Consent User',
        email: 'consent@test.com',
        password: 'password123',
        age: 22,
      });

      const consent = await PrivacyConsent.create({
        user: user._id,
        status: 'accepted',
        policyVersions: {
          privacyPolicy: '2.0',
          termsOfService: '2.0',
          communityGuidelines: '1.0',
        },
        language: 'en',
        consentSource: 'web_registration',
        agreements: {
          is18OrOlder: true,
          isAccurateInfo: true,
          acceptedTermsAndPrivacy: true,
          acceptedInactivityDeletion: true,
        },
        acceptedAt: new Date(),
      });

      assert.strictEqual(consent.status, 'accepted');
      assert.strictEqual(consent.policyVersions.privacyPolicy, '2.0');
      assert.strictEqual(consent.agreements.is18OrOlder, true);
      assert.strictEqual(consent.agreements.acceptedInactivityDeletion, true);
    });

    // ----------------------------------------------------
    // TEST 3: Superseding Old Consent Records
    // ----------------------------------------------------
    await test('Supersedes older consent record when user re-acknowledges', async () => {
      const user = await User.findOne({ email: 'consent@test.com' });

      // Mark existing as superseded
      await PrivacyConsent.updateMany(
        { user: user._id, status: 'accepted' },
        { $set: { status: 'superseded', supersededAt: new Date() } }
      );

      // Create new consent
      const newConsent = await PrivacyConsent.create({
        user: user._id,
        status: 'accepted',
        policyVersions: {
          privacyPolicy: '2.0',
          termsOfService: '2.0',
          communityGuidelines: '1.0',
        },
        consentSource: 'policy_update_modal',
        agreements: {
          is18OrOlder: true,
          isAccurateInfo: true,
          acceptedTermsAndPrivacy: true,
          acceptedInactivityDeletion: true,
        },
      });

      const oldConsents = await PrivacyConsent.find({ user: user._id, status: 'superseded' });
      assert.strictEqual(oldConsents.length, 1, 'Older consent must be marked superseded');
      assert.strictEqual(newConsent.status, 'accepted');
    });

    // ----------------------------------------------------
    // TEST 4: Maintenance Middleware Full-Site Blocking (503)
    // ----------------------------------------------------
    await test('Full-Site maintenance returns 503 and Retry-After header for regular users', async () => {
      const config = await MaintenanceConfig.getConfig();
      config.isActive = true;
      config.scope = 'full';
      config.expectedCompletionAt = new Date(Date.now() + 3600000); // 1 hour from now
      await config.save();
      invalidateMaintenanceCache();

      const req = {
        path: '/api/users/matches',
        method: 'GET',
        headers: {},
      };

      let statusReceived = null;
      let jsonReceived = null;
      let headersSet = {};

      const res = {
        setHeader: (k, v) => { headersSet[k] = v; },
        status: (code) => {
          statusReceived = code;
          return {
            json: (data) => { jsonReceived = data; },
          };
        },
      };

      let nextCalled = false;
      await maintenanceMiddleware(req, res, () => { nextCalled = true; });

      assert.strictEqual(statusReceived, 503, 'Should return HTTP 503 Service Unavailable');
      assert.strictEqual(nextCalled, false, 'Should block execution');
      assert.strictEqual(jsonReceived.maintenance, true);
      assert.strictEqual(jsonReceived.scope, 'full');
      assert(headersSet['Retry-After'] !== undefined, 'Must set Retry-After header');
    });

    // ----------------------------------------------------
    // TEST 5: Admin Bypass During Full-Site Maintenance
    // ----------------------------------------------------
    await test('Admin user bypasses maintenance mode completely', async () => {
      const adminToken = jwt.sign(
        { id: new mongoose.Types.ObjectId(), role: 'admin' },
        process.env.JWT_SECRET || 'dev_jwt_secret_change_me'
      );

      const req = {
        path: '/api/users/matches',
        method: 'GET',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      };

      let nextCalled = false;
      const res = {
        setHeader: () => {},
        status: () => ({ json: () => {} }),
      };

      await maintenanceMiddleware(req, res, () => { nextCalled = true; });

      assert.strictEqual(nextCalled, true, 'Admin request must call next() and bypass maintenance');
    });

    // ----------------------------------------------------
    // TEST 6: Public Endpoints Exempt from Maintenance
    // ----------------------------------------------------
    await test('Health check and auth login bypass maintenance mode', async () => {
      const exemptEndpoints = ['/', '/health', '/api/auth/login', '/api/maintenance/status'];

      for (const ep of exemptEndpoints) {
        let nextCalled = false;
        const req = { path: ep, method: 'GET', headers: {} };
        const res = { setHeader: () => {}, status: () => ({ json: () => {} }) };

        await maintenanceMiddleware(req, res, () => { nextCalled = true; });
        assert.strictEqual(nextCalled, true, `Endpoint ${ep} must bypass maintenance`);
      }
    });

    // ----------------------------------------------------
    // TEST 7: Feature-Specific Maintenance Routing
    // ----------------------------------------------------
    await test('Feature-specific maintenance blocks only affected features', async () => {
      const config = await MaintenanceConfig.getConfig();
      config.isActive = true;
      config.scope = 'feature_specific';
      config.affectedFeatures = ['messaging'];
      await config.save();
      invalidateMaintenanceCache();

      // Blocked feature: messaging
      const blockedReq = { path: '/api/messages/123', method: 'GET', headers: {} };
      let blockedStatus = null;
      let blockedNext = false;
      const res1 = {
        setHeader: () => {},
        status: (code) => {
          blockedStatus = code;
          return { json: () => {} };
        },
      };
      await maintenanceMiddleware(blockedReq, res1, () => { blockedNext = true; });
      assert.strictEqual(blockedStatus, 503, 'Messaging endpoint must return 503');
      assert.strictEqual(blockedNext, false);

      // Unaffected feature: blog
      const allowedReq = { path: '/api/blog', method: 'GET', headers: {} };
      let allowedNext = false;
      const res2 = {
        setHeader: () => {},
        status: () => ({ json: () => {} }),
      };
      await maintenanceMiddleware(allowedReq, res2, () => { allowedNext = true; });
      assert.strictEqual(allowedNext, true, 'Blog endpoint must not be blocked');
    });

    // ----------------------------------------------------
    // TEST 8: Coming Soon Email Subscription Duplicate Prevention
    // ----------------------------------------------------
    await test('Coming Soon notify-me email subscription prevents duplicate entries', async () => {
      const config = await MaintenanceConfig.getConfig();
      config.comingSoon = {
        enabled: true,
        subscribedEmails: [{ email: 'notify@test.com', subscribedAt: new Date() }],
      };
      await config.save();
      invalidateMaintenanceCache();

      let jsonRes = null;
      const req = { body: { email: 'NOTIFY@TEST.COM' } }; // Case-insensitive duplicate
      const res = {
        status: () => ({ json: (d) => { jsonRes = d; } }),
        json: (d) => { jsonRes = d; },
      };

      await subscribeComingSoon(req, res);

      assert.strictEqual(jsonRes.success, true);
      assert.strictEqual(jsonRes.alreadySubscribed, true, 'Should detect duplicate email');

      const updated = await MaintenanceConfig.getConfig();
      assert.strictEqual(updated.comingSoon.subscribedEmails.length, 1, 'Should not add duplicate email');
    });

  } finally {
    await tearDownDatabase();
  }

  console.log('\n======================================================');
  console.log(`TEST RESULTS: ${passed}/${total} PASSED`);
  console.log('======================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runVerification().catch((e) => {
  console.error('Test suite uncaught error:', e);
  process.exit(1);
});
