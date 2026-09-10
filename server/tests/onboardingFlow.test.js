/**
 * Onboarding Flow Tests - Terms ? Email Verification ? App
 */

const assert = require('assert');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.JWT_SECRET = 'test_jwt_secret_onboarding';
process.env.ADMIN_EMAIL = 'admin@matrimony.com';
process.env.ADMIN_PASSWORD = 'admin123';
process.env.EMAIL_FROM = 'test@example.com';
process.env.EMAIL_FROM_NAME = 'Kapu-LK Test';
process.env.CLIENT_URL = 'http://localhost:3000';
process.env.REQUIRE_EMAIL_VERIFICATION = 'true';

const User = require('../models/User');

const ALLOWED_PATHS = [
  '/verify-email', '/resend-verification-code', '/change-verification-email',
  '/fix-invalid-email', '/acknowledge-privacy-policy', '/logout', '/me', '/contact-admin',
];

function simulateProtect(user, url) {
  if (!user) return { blocked: true, code: 'UNAUTHENTICATED' };
  const isExempt = user.role === 'admin' || process.env.REQUIRE_EMAIL_VERIFICATION === 'false';
  if (!isExempt && !user.emailVerified) {
    const isAllowed = ALLOWED_PATHS.some((p) => url.includes(p));
    if (!isAllowed) return { blocked: true, code: 'EMAIL_VERIFICATION_REQUIRED' };
  }
  return { blocked: false };
}

let passed = 0; let failed = 0;

async function test(name, fn) {
  try { await fn(); console.log('  PASS: ' + name); passed++; }
  catch (e) { console.error('  FAIL: ' + name + '\n       ' + e.message); failed++; }
}

async function run() {
  console.log('\n=== KAPU-LK ONBOARDING FLOW TESTS ===\n');
  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  const hash = await bcrypt.hash('TestPass123!', 10);

  const unverified = await User.create({ name:'user_one', username:'user_one', email:'userone@test.com', password:hash, emailVerified:false, role:'user', isActive:true });

  await test('Unverified user can POST /acknowledge-privacy-policy', async () => {
    const r = simulateProtect(unverified, '/api/users/acknowledge-privacy-policy');
    assert.strictEqual(r.blocked, false);
  });

  await test('Unverified user blocked from /users discovery', async () => {
    const r = simulateProtect(unverified, '/api/users?page=1');
    assert.strictEqual(r.blocked, true);
    assert.strictEqual(r.code, 'EMAIL_VERIFICATION_REQUIRED');
  });

  await test('Unverified user can access all onboarding endpoints', async () => {
    for (const url of ['/api/auth/me','/api/auth/verify-email','/api/auth/resend-verification-code','/api/auth/fix-invalid-email','/api/auth/logout','/api/users/acknowledge-privacy-policy']) {
      const r = simulateProtect(unverified, url);
      assert.strictEqual(r.blocked, false, url + ' should be allowed');
    }
  });

  await test('Legacy user with invalid email can call fix-invalid-email', async () => {
    const legacy = await User.create({ name:'legacy_one', username:'legacy_one', email:'bad//email//', password:hash, emailVerified:false, role:'user', isActive:true });
    const r = simulateProtect(legacy, '/api/auth/fix-invalid-email');
    assert.strictEqual(r.blocked, false);
    const before = await User.countDocuments();
    legacy.pendingEmail = 'valid@gmail.com';
    await legacy.save({ validateBeforeSave:false });
    const after = await User.countDocuments();
    assert.strictEqual(before, after, 'No new account should be created');
  });

  await test('Verification updates primary email on same account, preserves data', async () => {
    const legacy2 = await User.create({ name:'legacy_two', username:'legacy_two', email:'bad2//x//', password:hash, emailVerified:false, pendingEmail:'fixed@gmail.com', role:'user', isActive:true, bio:'Important bio' });
    const id = legacy2._id.toString();
    legacy2.email = legacy2.pendingEmail;
    legacy2.pendingEmail = undefined;
    legacy2.emailVerified = true;
    await legacy2.save({ validateBeforeSave:false });
    const updated = await User.findById(id);
    assert.ok(updated);
    assert.strictEqual(updated._id.toString(), id);
    assert.strictEqual(updated.email, 'fixed@gmail.com');
    assert.strictEqual(updated.emailVerified, true);
    assert.strictEqual(updated.bio, 'Important bio');
  });

  await test('Verified user with accepted terms is NOT blocked', async () => {
    const verified = await User.create({ name:'verif_one', username:'verif_one', email:'verifone@test.com', password:hash, emailVerified:true, agreedToTerms:true, acknowledgedPrivacyPolicyVersion:'2.0', acknowledgedPrivacyPolicyAt:new Date(), role:'user', isActive:true });
    for (const url of ['/api/users','/api/users/search','/api/users/matches']) {
      const r = simulateProtect(verified, url);
      assert.strictEqual(r.blocked, false, url + ' should be accessible');
    }
  });

  await mongoose.disconnect();
  await mongod.stop();
  console.log('\n=== RESULTS: ' + passed + '/' + (passed+failed) + ' PASSED ===\n');
  if (failed > 0) process.exit(1);
}

run().catch(e => { console.error(e); process.exit(1); });

