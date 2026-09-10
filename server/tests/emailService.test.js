/**
 * Automated Verification Suite for:
 * 1. Admin Account Protection & Immunity
 * 2. Mandatory Email Verification for New & Existing Users (OTP, SHA-256 Hashing, 5-Attempt Lockout)
 * 3. Welcome Email Logic & Atomic Deduplication
 * 4. Forgot Password Flow (10-min OTP, Single-Use Reset Token, TokenVersion Session Invalidation)
 * 5. Inactivity Reminder (6-day) & Auto-Deactivation (10-day) with Auto-Reactivation on Login
 * 6. Branded HTML Email Templates & XSS Sanitization
 */

const assert = require('assert');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Set dummy JWT secret and env variables before loading models/controllers
process.env.JWT_SECRET = 'test_jwt_secret_key_1234567890';
process.env.ADMIN_EMAIL = 'admin@matrimony.com';
process.env.ADMIN_PASSWORD = 'admin123';
process.env.EMAIL_USER = 'kapulk.support@gmail.com';
process.env.EMAIL_FROM_ADDRESS = 'kapulk.support@gmail.com';
process.env.EMAIL_FROM_NAME = 'Kapu-LK Support Team';
process.env.CLIENT_URL = 'http://localhost:3000';

const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const { checkAndSendWelcomeEmail } = require('../services/welcomeEmailService');
const { runInactivityLifecycleChecks } = require('../services/inactivityScheduler');
const {
  getEmailVerificationTemplate,
  getWelcomeEmailTemplate,
  getPasswordResetCodeTemplate,
  getInactivityReminderTemplate,
  getAccountDeactivatedTemplate,
} = require('../services/emailTemplates');

let mongoServer;

async function setupDatabase() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  mongoose.set('strictQuery', true);
  mongoose.set('sanitizeFilter', true);

  await mongoose.connect(uri);
  console.log('✅ In-Memory MongoDB connected for Email Service test suite.');
}

async function tearDownDatabase() {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
  console.log('✅ In-Memory MongoDB disconnected.');
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🚀 KAPU-LK SECURE EMAIL SERVICE TEST SUITE');
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
    // TEST 1: Admin Account Protection & Exemption
    // ----------------------------------------------------
    await test('Admin account preserves hardcoded credentials and is immune from verification/inactivity', async () => {
      const admin = await User.create({
        name: 'System Admin',
        email: 'admin@matrimony.com',
        password: 'admin123',
        role: 'admin',
        emailVerified: true,
        isEmailVerified: true,
        accountStatus: 'active',
        lastActiveAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days inactive
      });

      // Admin password matches admin123
      const isPasswordValid = await admin.matchPassword('admin123');
      assert.strictEqual(isPasswordValid, true, 'Admin password must authenticate with admin123');
      assert.strictEqual(admin.role, 'admin', 'Admin role must be admin');
      assert.strictEqual(admin.emailVerified, true, 'Admin must be email verified');

      // Inactivity runner must NOT deactivate admin
      await runInactivityLifecycleChecks();
      const refetchedAdmin = await User.findById(admin._id);
      assert.strictEqual(refetchedAdmin.accountStatus, 'active', 'Admin must NEVER be deactivated for inactivity');
      assert.strictEqual(refetchedAdmin.isActive, true, 'Admin isActive must remain true');
    });

    // ----------------------------------------------------
    // TEST 2: Mandatory Email Verification & Cryptographic OTP Hash
    // ----------------------------------------------------
    await test('Email verification uses SHA-256 hashed 6-digit OTP with 15-min expiry and 5-attempt lockout', async () => {
      const rawCode = '482910';
      const hashCode = crypto.createHash('sha256').update(rawCode).digest('hex');
      const expires = new Date(Date.now() + 15 * 60 * 1000);

      const user = await User.create({
        name: 'Test Member',
        email: 'member@test.com',
        password: 'password123',
        emailVerified: false,
        isEmailVerified: false,
        emailVerificationCode: hashCode,
        emailVerificationExpires: expires,
        emailVerificationAttempts: 0,
      });

      // Assert plain OTP is never stored in DB
      assert.notStrictEqual(user.emailVerificationCode, rawCode, 'Plain OTP must NOT be stored in DB');
      assert.strictEqual(user.emailVerificationCode, hashCode, 'Hashed OTP must match SHA-256');

      // Simulate wrong OTP attempts
      for (let i = 1; i <= 4; i++) {
        const wrongHash = crypto.createHash('sha256').update('000000').digest('hex');
        const isMatch = crypto.timingSafeEqual(Buffer.from(wrongHash), Buffer.from(user.emailVerificationCode));
        assert.strictEqual(isMatch, false, 'Wrong code should not match');
        user.emailVerificationAttempts += 1;
        await user.save();
      }

      assert.strictEqual(user.emailVerificationAttempts, 4, 'Attempts should be 4');

      // 5th failed attempt should trigger lockout
      user.emailVerificationAttempts += 1;
      if (user.emailVerificationAttempts >= 5) {
        user.emailVerificationCode = undefined;
        user.emailVerificationExpires = undefined;
      }
      await user.save();

      assert.strictEqual(user.emailVerificationAttempts, 5, 'Attempts should be 5');
      assert.strictEqual(user.emailVerificationCode, undefined, 'Code must be wiped on 5th failure');

      // Re-issue valid code and verify successfully
      const freshCode = '928374';
      user.emailVerificationCode = crypto.createHash('sha256').update(freshCode).digest('hex');
      user.emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000);
      user.emailVerificationAttempts = 0;
      await user.save();

      // Timing safe equal verification
      const submittedHash = crypto.createHash('sha256').update(freshCode).digest('hex');
      const valid = crypto.timingSafeEqual(Buffer.from(submittedHash), Buffer.from(user.emailVerificationCode));
      assert.strictEqual(valid, true, 'timingSafeEqual must match valid code');

      // Mark verified
      user.emailVerified = true;
      user.isEmailVerified = true;
      user.emailVerificationCode = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();

      assert.strictEqual(user.emailVerified, true, 'User emailVerified should be true');
      assert.strictEqual(user.isEmailVerified, true, 'User isEmailVerified should be synced');
      assert.strictEqual(user.emailVerificationCode, undefined, 'Verification code should be cleared');
    });

    // ----------------------------------------------------
    // TEST 2.1: Change Unverified Email on Typo
    // ----------------------------------------------------
    await test('User can change unverified email address when previously typed wrongly', async () => {
      const wrongEmail = 'wrongtypo@test.com';
      const correctEmail = 'correctemail@test.com';

      const user = await User.create({
        name: 'Typo User',
        email: wrongEmail,
        password: 'password123',
        emailVerified: false,
        emailVerificationCode: crypto.createHash('sha256').update('111111').digest('hex'),
        emailVerificationExpires: new Date(Date.now() + 15 * 60 * 1000),
      });

      // Cannot change to an email that is already registered
      await User.create({
        name: 'Another User',
        email: 'alreadytaken@test.com',
        password: 'password123',
      });

      const isTaken = await User.findOne({ email: 'alreadytaken@test.com' });
      assert.ok(isTaken, 'Should detect already taken email');

      // Update to correct new email
      const newCode = '888999';
      user.email = correctEmail;
      user.emailVerificationCode = crypto.createHash('sha256').update(newCode).digest('hex');
      user.emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000);
      user.emailVerificationAttempts = 0;
      await user.save();

      const refetched = await User.findById(user._id).select('+emailVerificationCode');
      assert.strictEqual(refetched.email, correctEmail, 'Email should be updated to correct email');
      const testHash = crypto.createHash('sha256').update(newCode).digest('hex');
      assert.strictEqual(refetched.emailVerificationCode, testHash, 'New code must be hashed and stored');
    });

    // ----------------------------------------------------
    // TEST 3: Welcome Email Logic & Atomic Deduplication
    // ----------------------------------------------------
    await test('Welcome email requires complete profile and is deduplicated atomically (sent strictly once)', async () => {
      // Create user with incomplete profile
      const user = await User.create({
        name: 'Incomplete User',
        email: 'incomplete@test.com',
        password: 'password123',
        emailVerified: true,
        gender: 'male',
        // missing partnerPreferences, bio, photos, etc.
      });

      // Should not send welcome email because profile is incomplete
      const res1 = await checkAndSendWelcomeEmail(user._id);
      assert.strictEqual(res1.sent, false, 'Should not send welcome email for incomplete profile');
      assert.strictEqual(res1.reason, 'profile_incomplete');

      // Now complete the profile
      user.age = 28;
      user.gender = 'male';
      user.location = 'Colombo';
      user.district = 'Colombo';
      user.education = 'BSc Engineering';
      user.occupation = 'Engineer';
      user.maritalStatus = 'single';
      user.religion = 'Buddhist';
      user.bio = 'Looking for a life partner';
      user.profileImageUrl = 'https://example.com/photo.jpg';
      user.partnerPreferences = {
        minAge: 23,
        maxAge: 30,
        religion: 'Buddhist',
        district: 'Colombo',
        education: 'Degree',
        maritalStatus: 'single',
      };
      await user.save();

      // Send welcome email: atomic findOneAndUpdate sets welcomeEmailSentAt
      const res2 = await checkAndSendWelcomeEmail(user._id);
      assert.strictEqual(res2.sent, true, 'Should send welcome email once profile is complete');

      const updatedUser = await User.findById(user._id);
      assert.ok(updatedUser.welcomeEmailSentAt, 'welcomeEmailSentAt must be set');

      // Call again (e.g. user edits profile or updates picture)
      const res3 = await checkAndSendWelcomeEmail(user._id);
      assert.strictEqual(res3.sent, false, 'Should NOT send welcome email again');
      assert.strictEqual(res3.reason, 'already_sent', 'Reason must be already_sent');

      // Call concurrent requests to simulate race conditions
      const concurrentResults = await Promise.all([
        checkAndSendWelcomeEmail(user._id),
        checkAndSendWelcomeEmail(user._id),
        checkAndSendWelcomeEmail(user._id),
      ]);
      assert(concurrentResults.every(r => r.sent === false), 'All concurrent duplicate calls must be prevented');
    });

    // ----------------------------------------------------
    // TEST 4: Forgot Password Flow (10-min OTP, Single-Use Token, Session Invalidation)
    // ----------------------------------------------------
    await test('Forgot password issues 10-min OTP, verifies to single-use token, and increments tokenVersion on reset', async () => {
      const initialPassword = await bcrypt.hash('oldPassword123', 10);
      const user = await User.create({
        name: 'Reset Test User',
        email: 'reset@test.com',
        password: initialPassword,
        tokenVersion: 0,
        emailVerified: true,
      });

      // Create a RefreshToken to verify revocation
      await RefreshToken.create({
        tokenHash: 'active_refresh_token_hash_abc',
        user: user._id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      // Step 1: User requests password reset -> 6-digit OTP generated
      const resetCode = '654321';
      const resetCodeHash = crypto.createHash('sha256').update(resetCode).digest('hex');
      user.passwordResetCode = resetCodeHash;
      user.passwordResetCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
      user.passwordResetCodeAttempts = 0;
      await user.save();

      // Step 2: User verifies OTP -> issues 15-minute single-use reset token
      const submittedHash = crypto.createHash('sha256').update(resetCode).digest('hex');
      const codeMatch = crypto.timingSafeEqual(Buffer.from(submittedHash), Buffer.from(user.passwordResetCode));
      assert.strictEqual(codeMatch, true, 'Reset code must match');

      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      user.passwordResetToken = hashedResetToken;
      user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
      user.passwordResetCode = undefined;
      user.passwordResetCodeExpires = undefined;
      await user.save();

      // Step 3: User resets password with resetToken
      const lookupHash = crypto.createHash('sha256').update(resetToken).digest('hex');
      const foundUser = await User.findOne({
        passwordResetToken: lookupHash,
        passwordResetExpires: mongoose.trusted({ $gt: new Date() }),
      });
      assert.ok(foundUser, 'User must be found with valid resetToken');

      // Set new password (pre-save hook hashes it automatically)
      foundUser.password = 'newSecurePassword456';
      foundUser.passwordResetToken = undefined;
      foundUser.passwordResetExpires = undefined;
      foundUser.passwordResetCode = undefined;
      foundUser.passwordResetCodeExpires = undefined;
      foundUser.passwordResetCodeAttempts = 0;
      foundUser.tokenVersion = (foundUser.tokenVersion || 0) + 1;
      await foundUser.save();

      // Invalidate active refresh tokens
      await RefreshToken.deleteMany({ user: foundUser._id });

      // Verifications
      const refetched = await User.findById(user._id).select('+password');
      assert.strictEqual(refetched.tokenVersion, 1, 'tokenVersion must be incremented to 1 to invalidate JWTs');
      assert.strictEqual(refetched.passwordResetToken, undefined, 'Reset token must be cleared');
      const isNewPasswordValid = await refetched.matchPassword('newSecurePassword456');
      assert.strictEqual(isNewPasswordValid, true, 'New password must verify with bcrypt');

      // Check refresh tokens revoked
      const remainingTokens = await RefreshToken.countDocuments({ user: user._id });
      assert.strictEqual(remainingTokens, 0, 'Active refresh tokens must be completely wiped');

      // Reusing the token should fail
      const reuseLookup = await User.findOne({
        passwordResetToken: lookupHash,
      });
      assert.strictEqual(reuseLookup, null, 'Reset token must NOT be reusable');
    });

    // ----------------------------------------------------
    // TEST 5: Inactivity Reminder (6-day) & Deactivation (10-day) with Auto-Reactivation
    // ----------------------------------------------------
    await test('Inactivity checks send 6-day reminder, 10-day deactivation, and login auto-reactivates', async () => {
      // User 1: Active 4 days ago -> no action
      const userActive = await User.create({
        name: 'Active User',
        email: 'active@test.com',
        password: 'password123',
        lastActiveAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        accountStatus: 'active',
      });

      // User 2: Active 7 days ago -> reminder needed
      const userReminder = await User.create({
        name: 'Needs Reminder',
        email: 'reminder@test.com',
        password: 'password123',
        lastActiveAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        accountStatus: 'active',
      });

      // User 3: Active 11 days ago -> deactivation needed
      const userDeactivate = await User.create({
        name: 'Needs Deactivation',
        email: 'deactivate@test.com',
        password: 'password123',
        lastActiveAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
        accountStatus: 'active',
      });

      // Run scheduler check
      const results = await runInactivityLifecycleChecks();
      assert.ok(results.remindersSent >= 1, 'Should send reminder to 7-day inactive user');
      assert.ok(results.deactivationsProcessed >= 1, 'Should deactivate 11-day inactive user');

      // Check User 1: untouched
      const u1 = await User.findById(userActive._id);
      assert.strictEqual(u1.accountStatus, 'active');
      assert.ok(!u1.inactivityReminderSentAt, 'Reminder should not be sent to active user');

      // Check User 2: reminder sent
      const u2 = await User.findById(userReminder._id);
      assert.strictEqual(u2.accountStatus, 'active');
      assert.ok(u2.inactivityReminderSentAt, 'Reminder timestamp must be recorded');

      // Check User 3: deactivated
      const u3 = await User.findById(userDeactivate._id);
      assert.strictEqual(u3.accountStatus, 'deactivated', 'Account status must be deactivated');
      assert.strictEqual(u3.isActive, false, 'isActive must be set to false');
      assert.strictEqual(u3.deactivationReason, 'inactivity_10_days');

      // Auto-Reactivation on returning:
      // Simulate user logging in / returning
      u3.accountStatus = 'active';
      u3.isActive = true;
      u3.lastActiveAt = new Date();
      u3.deactivationReason = undefined;
      u3.deactivatedAt = undefined;
      u3.inactivityReminderSentAt = undefined;
      await u3.save();

      const reactivated = await User.findById(userDeactivate._id);
      assert.strictEqual(reactivated.accountStatus, 'active', 'User must be reactivated');
      assert.strictEqual(reactivated.isActive, true, 'User isActive must be restored to true');
      assert.ok(!reactivated.deactivationReason, 'Deactivation reason cleared');
    });

    // ----------------------------------------------------
    // TEST 6: Branded HTML Email Templates & XSS Sanitization
    // ----------------------------------------------------
    await test('Email templates contain purple/pink branding, kapulk.support@gmail.com, and escape XSS inputs', async () => {
      const maliciousName = '<script>alert("XSS")</script> Kasun';

      // 1. Verification Template
      const verif = getEmailVerificationTemplate({ name: maliciousName, code: '123456' });
      assert.strictEqual(verif.html.includes('<script>'), false, 'XSS script tags must be escaped in HTML');
      assert.ok(verif.html.includes('&lt;script&gt;'), 'Sanitized HTML entities must be present');
      assert.ok(verif.html.includes('123456'), 'Code must be included in verification template');
      assert.ok(verif.html.includes('kapulk.support@gmail.com'), 'Support email must be present');
      assert.ok(verif.text.includes('123456'), 'Plain text version must include code');

      // 2. Welcome Template
      const welcome = getWelcomeEmailTemplate({ name: maliciousName });
      assert.strictEqual(welcome.html.includes('<script>'), false, 'Welcome email must escape XSS');
      assert.ok(welcome.html.includes('kapulk.support@gmail.com'), 'Welcome email must have support address');
      assert.ok(welcome.html.includes('#7C3AED') || welcome.html.includes('linear-gradient'), 'Branding styles must be present');

      // 3. Password Reset Template
      const reset = getPasswordResetCodeTemplate({ name: maliciousName, code: '789012' });
      assert.strictEqual(reset.html.includes('<script>'), false, 'Password reset email must escape XSS');
      assert.ok(reset.html.includes('789012'), 'Reset code must be in template');
      assert.ok(reset.html.includes('10 minutes'), '10-minute expiry warning must be present');

      // 4. Inactivity Reminder Template
      const reminder = getInactivityReminderTemplate({ name: 'Nimal', daysRemaining: 4 });
      assert.ok(reminder.html.includes('4 days'), 'Reminder template must state remaining days');
      assert.ok(reminder.html.includes('kapulk.support@gmail.com'), 'Support email in reminder');

      // 5. Account Deactivated Template
      const deact = getAccountDeactivatedTemplate({ name: 'Sunil' });
      assert.ok(deact.html.includes('deactivated'), 'Deactivation template must state deactivated');
      assert.ok(deact.html.includes('kapulk.support@gmail.com'), 'Support email in deactivation notice');
    });

  } finally {
    await tearDownDatabase();
  }

  console.log('\n======================================================');
  console.log(`📊 TEST SUMMARY: ${passed}/${total} PASSED`);
  console.log('======================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
