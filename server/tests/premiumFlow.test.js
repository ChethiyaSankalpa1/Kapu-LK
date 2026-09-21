/**
 * End-to-End Premium Payment Request & Admin Approval Flow Tests
 */

const assert = require('assert');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.JWT_SECRET = 'test_jwt_secret_premium';
process.env.ADMIN_EMAIL = 'admin@matrimony.com';
process.env.ADMIN_PASSWORD = 'admin123';
process.env.EMAIL_FROM = 'test@example.com';
process.env.EMAIL_FROM_NAME = 'Kapu-LK Test';
process.env.REQUIRE_EMAIL_VERIFICATION = 'false';

const User = require('../models/User');
const PremiumPaymentRequest = require('../models/PremiumPaymentRequest');
const PremiumPlan = require('../models/PremiumPlan');
const Notification = require('../models/Notification');
const { Wallet, WalletTransaction } = require('../models/Wallet');
const premiumController = require('../controllers/premiumController');
const adminController = require('../controllers/adminController');

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log('  PASS: ' + name);
    passed++;
  } catch (e) {
    console.error('  FAIL: ' + name + '\n       ' + e.message);
    failed++;
  }
}

async function run() {
  console.log('\n=== KAPU-LK PREMIUM PAYMENT & ADMIN APPROVAL TESTS ===\n');
  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  const passwordHash = await bcrypt.hash('TestPass123!', 10);

  // 1. Create test user and admin
  const user = await User.create({
    name: 'Kasun Perera',
    username: 'kasunp',
    email: 'kasun@test.com',
    password: passwordHash,
    phoneNumber: '0712345678',
    emailVerified: true,
    role: 'user',
    isActive: true,
  });

  const adminUser = await User.create({
    name: 'Admin User',
    username: 'admin',
    email: 'admin@matrimony.com',
    password: passwordHash,
    emailVerified: true,
    role: 'admin',
    isActive: true,
  });

  // Test 1: User creates a Premium Payment Request
  let createdRequestId = null;
  await test('User can create a Premium payment request with slip details', async () => {
    const req = {
      user: { _id: user._id },
      body: {
        bank: 'Sampath Bank',
        paymentMethod: 'bank_transfer',
        accountHolderName: 'Kasun Perera',
        email: 'kasun@test.com',
        phoneNumber: '0712345678',
        transactionReference: 'TXN-987654321',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentAmount: '1300',
        planBadge: 'silver',
        notes: 'TOPUP Remark included',
      },
      file: {
        buffer: Buffer.from('fake-image-bytes'),
        mimetype: 'image/jpeg',
      },
      ip: '127.0.0.1',
      headers: {},
    };

    // Mock cloudinary uploader for testing
    const originalUpload = require('../config/cloudinary').uploader.upload;
    require('../config/cloudinary').uploader.upload = async () => ({
      secure_url: 'https://res.cloudinary.com/test/image/upload/sample_slip.jpg',
    });

    let jsonResult = null;
    let statusCode = 200;
    const res = {
      status: (code) => { statusCode = code; return res; },
      json: (data) => { jsonResult = data; return res; },
    };

    await premiumController.createPaymentRequest(req, res);
    require('../config/cloudinary').uploader.upload = originalUpload;

    assert.strictEqual(statusCode, 201);
    assert(jsonResult._id);
    assert.strictEqual(jsonResult.planBadge, 'silver');
    assert.strictEqual(jsonResult.paymentAmount, 1300);
    assert.strictEqual(jsonResult.status, 'pending');
    createdRequestId = jsonResult._id;

    // Verify user object updated with pending reference
    const updatedUser = await User.findById(user._id);
    assert.strictEqual(updatedUser.premiumRequested, true);
    assert.strictEqual(String(updatedUser.pendingPremiumRequest), String(createdRequestId));
  });

  // Test 2: Admin fetches all requests
  await test('Admin receives pending requests with populated user details', async () => {
    const req = { user: { _id: adminUser._id } };
    let jsonResult = null;
    const res = {
      status: () => res,
      json: (data) => { jsonResult = data; return res; },
    };

    await premiumController.getAllRequests(req, res);

    assert(Array.isArray(jsonResult));
    assert.strictEqual(jsonResult.length, 1);
    const found = jsonResult[0];
    assert.strictEqual(String(found._id), String(createdRequestId));
    assert.strictEqual(found.user.name, 'Kasun Perera');
    assert.strictEqual(found.user.email, 'kasun@test.com');
    assert.strictEqual(found.bank, 'Sampath Bank');
    assert.strictEqual(found.transactionReference, 'TXN-987654321');
  });

  // Test 3: Admin approves the request
  await test('Admin approves request, activates Premium status & expiration, sends notification', async () => {
    const req = {
      params: { id: createdRequestId },
      user: { _id: adminUser._id },
      ip: '127.0.0.1',
      headers: {},
    };
    let jsonResult = null;
    const res = {
      status: () => res,
      json: (data) => { jsonResult = data; return res; },
    };

    await premiumController.approveRequest(req, res);

    assert(jsonResult.request);
    assert.strictEqual(jsonResult.request.status, 'approved');

    // Verify user updated
    const updatedUser = await User.findById(user._id);
    assert.strictEqual(updatedUser.isPremium, true);
    assert.strictEqual(updatedUser.premiumPlan, 'silver');
    assert.strictEqual(updatedUser.premiumStatus, 'active');
    assert.strictEqual(updatedUser.premiumRequested, false);
    assert.strictEqual(updatedUser.pendingPremiumRequest, null);
    assert(updatedUser.premiumExpiresAt > new Date());

    // Verify notification created
    const notif = await Notification.findOne({ user: user._id, type: 'premium_activated' });
    assert(notif);
    assert(notif.message.includes('SILVER'));

    // Verify wallet transaction recorded for audit
    const tx = await WalletTransaction.findOne({ user: user._id, relatedType: 'premium' });
    assert(tx);
    assert.strictEqual(tx.amount, 1300);
  });

  // Test 4: Second request rejection flow
  await test('User submits second request and Admin rejection properly resets user pending state', async () => {
    // Mock second request creation
    const req2 = await PremiumPaymentRequest.create({
      user: user._id,
      bank: 'Bank of Ceylon',
      paymentMethod: 'bank_transfer',
      accountHolderName: 'Kasun Perera',
      email: 'kasun@test.com',
      phoneNumber: '0712345678',
      transactionReference: 'TXN-112233',
      paymentDate: new Date(),
      paymentAmount: 3000,
      paymentSlipUrl: 'https://res.cloudinary.com/test/image/upload/slip2.jpg',
      planBadge: 'gold',
      durationDays: 60,
      status: 'pending',
    });

    await User.findByIdAndUpdate(user._id, {
      premiumRequested: true,
      pendingPremiumRequest: req2._id,
    });

    const reqReject = {
      params: { id: req2._id },
      body: { rejectionReason: 'Slip illegible' },
      user: { _id: adminUser._id },
      ip: '127.0.0.1',
      headers: {},
    };
    let jsonResult = null;
    const res = {
      status: () => res,
      json: (data) => { jsonResult = data; return res; },
    };

    await premiumController.rejectRequest(reqReject, res);

    assert.strictEqual(jsonResult.request.status, 'rejected');
    assert.strictEqual(jsonResult.request.rejectionReason, 'Slip illegible');

    const refreshedUser = await User.findById(user._id);
    assert.strictEqual(refreshedUser.premiumRequested, false);
    assert.strictEqual(refreshedUser.pendingPremiumRequest, null);
  });

  console.log(`\nTests finished: ${passed} passed, ${failed} failed.\n`);
  await mongoose.disconnect();
  await mongod.stop();

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal error in tests:', err);
  process.exit(1);
});
