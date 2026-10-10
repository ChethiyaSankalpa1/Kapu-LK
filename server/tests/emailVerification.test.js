const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../models/User');
const app = require('../server');

describe('Email Verification and Password Reset Tests', () => {
  let testUser;
  let invalidEmailUser;
  let verificationCode;
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    // Clean up test data
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
  });

  describe('Email Validation', () => {
    test('should reject invalid email formats during registration', async () => {
      const invalidEmails = [
        'chethiya//56//',
        'invalid-email',
        'test@',
        '@test.com',
        'test space@test.com',
        'test..double..dot@test.com',
      ];

      for (const invalidEmail of invalidEmails) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            name: 'Test User',
            email: invalidEmail,
            password: 'password123',
            age: 18,
            gender: 'male',
            agreedToTerms: true,
            is18OrOlder: true,
            isAccurateInfo: true,
            acceptedTermsAndPrivacy: true,
            acceptedInactivityDeletion: true,
          });

        expect(response.status).toBe(400);
        expect(response.body.message).toMatch(/valid email/i);
      }
    });

    test('should accept valid email formats during registration', async () => {
      const validEmails = [
        'test@example.com',
        'user.name+tag@example.com',
        'user_name@example.co.uk',
        'user123@test-domain.com',
      ];

      for (const validEmail of validEmails) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            name: 'Test User',
            email: validEmail,
            password: 'password123',
            age: 18,
            gender: 'male',
            agreedToTerms: true,
            is18OrOlder: true,
            isAccurateInfo: true,
            acceptedTermsAndPrivacy: true,
            acceptedInactivityDeletion: true,
          });

        // Should not fail due to email validation (might fail for other reasons)
        expect(response.status).not.toBe(400);
        if (response.status === 400) {
          expect(response.body.message).not.toMatch(/valid email/i);
        }
      }
    });
  });

  describe('Email Verification Flow', () => {
    beforeEach(async () => {
      // Create a test user with unverified email
      testUser = await User.create({
        name: 'Test User',
        email: 'testuser@example.com',
        password: 'password123',
        age: 18,
        gender: 'male',
        emailVerified: false,
        agreedToTerms: true,
        acknowledgedPrivacyPolicyAt: new Date(),
        acknowledgedPrivacyPolicyVersion: '2.0',
      });

      // Generate verification code
      const crypto = require('crypto');
      verificationCode = crypto.randomInt(100000, 1000000).toString();
      const hashedCode = crypto.createHash('sha256').update(verificationCode).digest('hex');
      
      testUser.emailVerificationCode = hashedCode;
      testUser.emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000);
      await testUser.save();
    });

    afterEach(async () => {
      await User.deleteOne({ _id: testUser._id });
    });

    test('should verify email and update emailVerified flag', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({
          email: 'testuser@example.com',
          code: verificationCode,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.emailVerified).toBe(true);

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.emailVerified).toBe(true);
      expect(updatedUser.emailVerificationCode).toBeUndefined();
    });

    test('should update primary email when verifying pending email', async () => {
      const crypto = require('crypto');
      const newEmail = 'newemail@example.com';
      const newVerificationCode = crypto.randomInt(100000, 1000000).toString();
      const newHashedCode = crypto.createHash('sha256').update(newVerificationCode).digest('hex');

      testUser.pendingEmail = newEmail;
      testUser.emailVerificationCode = newHashedCode;
      testUser.emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000);
      await testUser.save();

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({
          email: newEmail,
          code: newVerificationCode,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.emailChanged).toBe(true);
      expect(response.body.email).toBe(newEmail);

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.email).toBe(newEmail);
      expect(updatedUser.pendingEmail).toBeUndefined();
      expect(updatedUser.emailVerified).toBe(true);
    });

    test('should not allow email verification with invalid code', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({
          email: 'testuser@example.com',
          code: '000000',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/invalid|incorrect/i);

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.emailVerified).toBe(false);
    });

    test('should not allow email verification with expired code', async () => {
      testUser.emailVerificationExpires = new Date(Date.now() - 1000);
      await testUser.save();

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({
          email: 'testuser@example.com',
          code: verificationCode,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/expired/i);
    });
  });

  describe('Email Change with Verification', () => {
    beforeEach(async () => {
      testUser = await User.create({
        name: 'Test User',
        email: 'oldemail@example.com',
        password: 'password123',
        age: 18,
        gender: 'male',
        emailVerified: false,
        agreedToTerms: true,
        acknowledgedPrivacyPolicyAt: new Date(),
        acknowledgedPrivacyPolicyVersion: '2.0',
      });
    });

    afterEach(async () => {
      await User.deleteOne({ _id: testUser._id });
    });

    test('should request email change and store in pendingEmail', async () => {
      const response = await request(app)
        .post('/api/auth/change-verification-email')
        .send({
          oldEmail: 'oldemail@example.com',
          newEmail: 'newemail@example.com',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.pendingEmail).toBe('newemail@example.com');

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.pendingEmail).toBe('newemail@example.com');
      expect(updatedUser.email).toBe('oldemail@example.com'); // Primary email unchanged
    });

    test('should not allow email change to already registered email', async () => {
      // Create another user with the target email
      await User.create({
        name: 'Another User',
        email: 'taken@example.com',
        password: 'password123',
        age: 18,
        gender: 'male',
        agreedToTerms: true,
        acknowledgedPrivacyPolicyAt: new Date(),
        acknowledgedPrivacyPolicyVersion: '2.0',
      });

      const response = await request(app)
        .post('/api/auth/change-verification-email')
        .send({
          oldEmail: 'oldemail@example.com',
          newEmail: 'taken@example.com',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/already registered/i);

      await User.deleteOne({ email: 'taken@example.com' });
    });

    test('should not allow email change if email is already verified', async () => {
      testUser.emailVerified = true;
      await testUser.save();

      const response = await request(app)
        .post('/api/auth/change-verification-email')
        .send({
          oldEmail: 'oldemail@example.com',
          newEmail: 'newemail@example.com',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/already verified/i);
    });
  });

  describe('Invalid Email Fix', () => {
    beforeEach(async () => {
      // Create user with invalid email (simulating old data)
      invalidEmailUser = await User.create({
        name: 'Invalid Email User',
        email: 'chethiya//56//',
        password: 'password123',
        age: 18,
        gender: 'male',
        emailVerified: false,
        agreedToTerms: true,
        acknowledgedPrivacyPolicyAt: new Date(),
        acknowledgedPrivacyPolicyVersion: '2.0',
      });
    });

    afterEach(async () => {
      await User.deleteOne({ _id: invalidEmailUser._id });
    });

    test('should allow authenticated user to fix invalid email with password confirmation', async () => {
      // Login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'chethiya//56//',
          password: 'password123',
        });

      const token = loginResponse.body.token;

      const response = await request(app)
        .post('/api/auth/fix-invalid-email')
        .set('Authorization', `Bearer ${token}`)
        .send({
          newEmail: 'chethiyasankalpa456@gmail.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.pendingEmail).toBe('chethiyasankalpa456@gmail.com');

      const updatedUser = await User.findById(invalidEmailUser._id);
      expect(updatedUser.pendingEmail).toBe('chethiyasankalpa456@gmail.com');
      expect(updatedUser.email).toBe('chethiya//56//'); // Primary email unchanged until verification
    });

    test('should not allow email fix without password confirmation', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'chethiya//56//',
          password: 'password123',
        });

      const token = loginResponse.body.token;

      const response = await request(app)
        .post('/api/auth/fix-invalid-email')
        .set('Authorization', `Bearer ${token}`)
        .send({
          newEmail: 'chethiyasankalpa456@gmail.com',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/password/i);
    });

    test('should not allow email fix with wrong password', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'chethiya//56//',
          password: 'password123',
        });

      const token = loginResponse.body.token;

      const response = await request(app)
        .post('/api/auth/fix-invalid-email')
        .set('Authorization', `Bearer ${token}`)
        .send({
          newEmail: 'chethiyasankalpa456@gmail.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/invalid password/i);
    });
  });

  describe('Forgot Password', () => {
    beforeEach(async () => {
      testUser = await User.create({
        name: 'Test User',
        email: 'testuser@example.com',
        password: 'password123',
        age: 18,
        gender: 'male',
        emailVerified: true,
        agreedToTerms: true,
        acknowledgedPrivacyPolicyAt: new Date(),
        acknowledgedPrivacyPolicyVersion: '2.0',
      });
    });

    afterEach(async () => {
      await User.deleteOne({ _id: testUser._id });
    });

    test('should send reset code to valid email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'testuser@example.com',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/verification code.*sent/i);
    });

    test('should validate email format before processing forgot password', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'invalid-email-format',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/valid email/i);
    });

    test('should return generic message for non-existent email (account enumeration protection)', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'nonexistent@example.com',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/if that email exists/i);
    });

    test('should find user by verified email after email change', async () => {
      // Simulate email change completion
      testUser.email = 'chethiyasankalpa456@gmail.com';
      testUser.emailVerified = true;
      await testUser.save();

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'chethiyasankalpa456@gmail.com',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.passwordResetCode).toBeDefined();
    });
  });

  describe('Data Integrity', () => {
    test('should preserve user data during email change', async () => {
      testUser = await User.create({
        name: 'Test User',
        email: 'oldemail@example.com',
        password: 'password123',
        age: 25,
        gender: 'male',
        bio: 'Test bio',
        location: 'Test location',
        emailVerified: false,
        agreedToTerms: true,
        acknowledgedPrivacyPolicyAt: new Date(),
        acknowledgedPrivacyPolicyVersion: '2.0',
      });

      const userId = testUser._id;
      const originalName = testUser.name;
      const originalAge = testUser.age;
      const originalBio = testUser.bio;

      // Request email change
      await request(app)
        .post('/api/auth/change-verification-email')
        .send({
          oldEmail: 'oldemail@example.com',
          newEmail: 'newemail@example.com',
        });

      // Verify user data is preserved
      const updatedUser = await User.findById(userId);
      expect(updatedUser._id.toString()).toBe(userId.toString());
      expect(updatedUser.name).toBe(originalName);
      expect(updatedUser.age).toBe(originalAge);
      expect(updatedUser.bio).toBe(originalBio);

      await User.deleteOne({ _id: userId });
    });

    test('should not create duplicate accounts during email verification', async () => {
      const crypto = require('crypto');
      
      // Create two users
      const user1 = await User.create({
        name: 'User 1',
        email: 'user1@example.com',
        password: 'password123',
        age: 18,
        gender: 'male',
        emailVerified: false,
        agreedToTerms: true,
        acknowledgedPrivacyPolicyAt: new Date(),
        acknowledgedPrivacyPolicyVersion: '2.0',
      });

      const user2 = await User.create({
        name: 'User 2',
        email: 'user2@example.com',
        password: 'password123',
        age: 18,
        gender: 'male',
        emailVerified: false,
        agreedToTerms: true,
        acknowledgedPrivacyPolicyAt: new Date(),
        acknowledgedPrivacyPolicyVersion: '2.0',
      });

      const user1Id = user1._id;
      const user2Id = user2._id;

      // Try to change user1's email to user2's email
      const response = await request(app)
        .post('/api/auth/change-verification-email')
        .send({
          oldEmail: 'user1@example.com',
          newEmail: 'user2@example.com',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/already registered/i);

      // Verify no duplicate accounts created
      const userCount = await User.countDocuments({
        email: 'user2@example.com'
      });
      expect(userCount).toBe(1);

      await User.deleteMany({ _id: { $in: [user1Id, user2Id] } });
    });
  });
});