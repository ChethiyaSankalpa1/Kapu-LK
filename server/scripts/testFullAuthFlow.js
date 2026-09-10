/**
 * Comprehensive End-to-End Integration Verification Script
 *
 * Tests the complete user lifecycle:
 * 1. User Registration (with all required fields & privacy consents)
 * 2. 6-Digit Email Verification Code Validation
 * 3. User Login (verifying active session & tokens)
 * 4. Forgot Password 6-Digit Code Request
 * 5. Password Reset Code Verification & Reset Token Issuance
 * 6. Password Reset with New Password
 * 7. Login with New Password
 */

const assert = require('assert');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
process.env.JWT_SECRET = process.env.JWT_SECRET || 'full_flow_test_jwt_secret_998877';
process.env.ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@matrimony.com';
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
process.env.EMAIL_USER = process.env.EMAIL_USER || 'kapulk.support@gmail.com';
process.env.NODE_ENV = 'test';

const User = require('../models/User');
const authController = require('../controllers/authController');

function mockReqRes(body = {}, headers = {}, user = null) {
  let resStatus = 200;
  let resData = null;
  const res = {
    status(s) {
      resStatus = s;
      return this;
    },
    json(d) {
      resData = d;
      return this;
    },
    cookie() {
      return this;
    },
    clearCookie() {
      return this;
    },
  };
  const req = {
    body,
    headers: {
      'user-agent': 'FullFlowTester/1.0',
      'x-forwarded-for': '127.0.0.1',
      ...headers,
    },
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
    user,
  };
  return {
    req,
    res,
    getStatus: () => resStatus,
    getData: () => resData,
  };
}

async function runFullFlow() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING FULL AUTH LIFECYCLE INTEGRATION TEST');
  console.log('======================================================\n');

  const mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  console.log('✅ Connected to in-memory database');

  try {
    const demoEmail = 'kapulk.support@gmail.com';
    const initialPassword = 'DemoPassword123!';
    const newPassword = 'NewDemoPassword456@';

    // ----------------------------------------------------
    // STEP 1: REGISTRATION
    // ----------------------------------------------------
    console.log('👉 Step 1: Registering new demo user...');
    const regPayload = {
      name: 'Demo Test User',
      email: demoEmail,
      password: initialPassword,
      gender: 'male',
      age: 26,
      language: 'en',
      is18OrOlder: true,
      isAccurateInfo: true,
      acceptedTermsAndPrivacy: true,
      acceptedInactivityDeletion: true,
      policyVersions: { privacyPolicy: '2.0' },
    };

    const regCtx = mockReqRes(regPayload);
    await authController.register(regCtx.req, regCtx.res);

    assert.strictEqual(regCtx.getStatus(), 201, `Registration should return 201, got ${regCtx.getStatus()}: ${JSON.stringify(regCtx.getData())}`);
    const regUser = regCtx.getData();
    assert.strictEqual(regUser.email, demoEmail);
    assert.strictEqual(regUser.emailVerified, false, 'User must initially be unverified');
    console.log('✅ Step 1 PASSED: User registered with emailVerified: false');

    // Fetch user with verification code from DB
    const savedUser = await User.findOne({ email: demoEmail }).select('+emailVerificationCode +emailVerificationExpires');
    assert.ok(savedUser.emailVerificationCode, 'emailVerificationCode must be saved in database');
    console.log('   Saved SHA-256 OTP hash:', savedUser.emailVerificationCode.slice(0, 16) + '...');

    // ----------------------------------------------------
    // STEP 2: EMAIL VERIFICATION
    // ----------------------------------------------------
    console.log('\n👉 Step 2: Verifying email with verification code...');
    // We test with an incorrect code first to test lockout protection
    const wrongCtx = mockReqRes({ email: demoEmail, code: '000000' });
    await authController.verifyEmail(wrongCtx.req, wrongCtx.res);
    assert.strictEqual(wrongCtx.getStatus(), 400, 'Wrong OTP code must return 400');
    console.log('   Lockout guard verified: wrong code rejected with 400');

    // Simulate requesting a fresh code through resend
    const resendCtx = mockReqRes({ email: demoEmail });
    // Clear cooldown to allow resend
    savedUser.emailVerificationCooldown = new Date(Date.now() - 1000);
    await savedUser.save();

    await authController.resendVerificationCode(resendCtx.req, resendCtx.res);
    assert.strictEqual(resendCtx.getStatus(), 200, `Resend should return 200, got ${resendCtx.getStatus()}`);
    console.log('   Resend code triggered successfully');

    // For testing verification, generate a known 6-digit code and set hash
    const crypto = require('crypto');
    const testCode = '654321';
    const testHash = crypto.createHash('sha256').update(testCode).digest('hex');
    savedUser.emailVerificationCode = testHash;
    savedUser.emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000);
    await savedUser.save();

    const verifyCtx = mockReqRes({ email: demoEmail, code: testCode });
    await authController.verifyEmail(verifyCtx.req, verifyCtx.res);
    assert.strictEqual(verifyCtx.getStatus(), 200, `verifyEmail should return 200, got ${verifyCtx.getStatus()}: ${JSON.stringify(verifyCtx.getData())}`);

    const verifiedUser = await User.findOne({ email: demoEmail });
    assert.strictEqual(verifiedUser.emailVerified, true, 'emailVerified must be true');
    assert.strictEqual(verifiedUser.isEmailVerified, true, 'isEmailVerified must be true');
    console.log('✅ Step 2 PASSED: Email successfully verified');

    // ----------------------------------------------------
    // STEP 3: LOGIN
    // ----------------------------------------------------
    console.log('\n👉 Step 3: Logging in with verified account...');
    const loginCtx = mockReqRes({ email: demoEmail, password: initialPassword });
    await authController.login(loginCtx.req, loginCtx.res);
    assert.strictEqual(loginCtx.getStatus(), 200, `Login should return 200, got ${loginCtx.getStatus()}`);
    const loginData = loginCtx.getData();
    assert.strictEqual(loginData.emailVerified, true);
    assert.strictEqual(loginData.requiresEmailVerification, false);
    console.log('✅ Step 3 PASSED: Verified login succeeded without verification redirection');

    // ----------------------------------------------------
    // STEP 4: FORGOT PASSWORD REQUEST
    // ----------------------------------------------------
    console.log('\n👉 Step 4: Requesting forgot password code...');
    const forgotCtx = mockReqRes({ email: demoEmail });
    await authController.forgotPassword(forgotCtx.req, forgotCtx.res);
    assert.strictEqual(forgotCtx.getStatus(), 200, `Forgot password should return 200, got ${forgotCtx.getStatus()}`);

    const userWithReset = await User.findOne({ email: demoEmail }).select('+passwordResetCode +passwordResetCodeExpires');
    assert.ok(userWithReset.passwordResetCode, 'passwordResetCode must be populated in database');
    assert.ok(userWithReset.passwordResetCodeExpires, 'passwordResetCodeExpires must be populated');
    console.log('✅ Step 4 PASSED: Reset code generated and saved to DB schema');

    // ----------------------------------------------------
    // STEP 5: VERIFY RESET CODE & RECEIVE RESET TOKEN
    // ----------------------------------------------------
    console.log('\n👉 Step 5: Verifying reset code...');
    const knownResetCode = '123456';
    const knownResetHash = crypto.createHash('sha256').update(knownResetCode).digest('hex');
    userWithReset.passwordResetCode = knownResetHash;
    userWithReset.passwordResetCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
    await userWithReset.save();

    const verifyResetCtx = mockReqRes({ email: demoEmail, code: knownResetCode });
    await authController.verifyResetCode(verifyResetCtx.req, verifyResetCtx.res);
    assert.strictEqual(verifyResetCtx.getStatus(), 200, `verifyResetCode should return 200, got ${verifyResetCtx.getStatus()}: ${JSON.stringify(verifyResetCtx.getData())}`);
    const resetToken = verifyResetCtx.getData().resetToken;
    assert.ok(resetToken, 'Must receive resetToken in response');
    console.log('✅ Step 5 PASSED: Code verified and reset token issued:', resetToken.slice(0, 16) + '...');

    // ----------------------------------------------------
    // STEP 6: RESET PASSWORD WITH TOKEN
    // ----------------------------------------------------
    console.log('\n👉 Step 6: Setting new password...');
    const resetPwCtx = mockReqRes({ resetToken, newPassword });
    await authController.resetPassword(resetPwCtx.req, resetPwCtx.res);
    assert.strictEqual(resetPwCtx.getStatus(), 200, `resetPassword should return 200, got ${resetPwCtx.getStatus()}: ${JSON.stringify(resetPwCtx.getData())}`);
    console.log('✅ Step 6 PASSED: Password changed successfully');

    // ----------------------------------------------------
    // STEP 7: LOGIN WITH NEW PASSWORD
    // ----------------------------------------------------
    console.log('\n👉 Step 7: Testing login with old and new password...');
    // Old password must fail
    const oldLoginCtx = mockReqRes({ email: demoEmail, password: initialPassword });
    await authController.login(oldLoginCtx.req, oldLoginCtx.res);
    assert.strictEqual(oldLoginCtx.getStatus(), 401, 'Old password must be rejected with 401');
    console.log('   Old password rejected with 401');

    // New password must succeed
    const newLoginCtx = mockReqRes({ email: demoEmail, password: newPassword });
    await authController.login(newLoginCtx.req, newLoginCtx.res);
    assert.strictEqual(newLoginCtx.getStatus(), 200, 'New password must succeed with 200');
    console.log('✅ Step 7 PASSED: Login with new password succeeded!');

    console.log('\n======================================================');
    console.log('🎉 ALL 7 AUTH LIFECYCLE STEPS PASSED WITH 100% SUCCESS');
    console.log('======================================================\n');
  } finally {
    await mongoose.disconnect();
    await mongoServer.stop();
  }
}

runFullFlow().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
