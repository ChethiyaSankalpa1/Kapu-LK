/**
 * Migration Script: Safely initialize email verification & lifecycle fields
 *
 * Rules:
 * - Admin account (role: 'admin') is set to emailVerified: true and accountStatus: 'active'.
 * - Existing members with missing/undefined emailVerified are set to emailVerified: false.
 * - No user accounts, photos, or messages are deleted or damaged.
 * - Safe and idempotent: can be run repeatedly without causing duplicate actions.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

async function migrateEmailVerification(existingMongoose = null) {
  let shouldDisconnect = false;

  if (!existingMongoose && mongoose.connection.readyState !== 1) {
    if (!process.env.MONGO_URI) {
      console.warn('[Migration] MONGO_URI not defined, skipping standalone migration execution.');
      return { modifiedUsers: 0, verifiedAdmins: 0 };
    }
    await mongoose.connect(process.env.MONGO_URI);
    shouldDisconnect = true;
    console.log('[Migration] Connected to MongoDB.');
  }

  try {
    // 1. Mark all admin users as verified and active unconditionally
    const adminRes = await User.updateMany(
      { role: 'admin' },
      {
        $set: {
          emailVerified: true,
          isEmailVerified: true,
          accountStatus: 'active',
          inactivityReminderSentAt: null,
          deactivatedAt: null,
          deactivationReason: null,
        },
      }
    );

    // 2. Initialize non-admin existing members who don't have emailVerified set
    const userRes = await User.updateMany(
      {
        role: { $ne: 'admin' },
        emailVerified: mongoose.trusted({ $exists: false }),
      },
      {
        $set: {
          emailVerified: false,
          isEmailVerified: false,
          accountStatus: 'active',
          inactivityReminderSentAt: null,
          deactivatedAt: null,
          deactivationReason: null,
        },
      }
    );

    // 3. Initialize lastActiveAt for existing users who don't have it
    await User.updateMany(
      { lastActiveAt: mongoose.trusted({ $exists: false }) },
      { $set: { lastActiveAt: new Date() } }
    );

    console.log(
      `[Migration] Completed: ${adminRes.modifiedCount || 0} admin(s) verified, ${userRes.modifiedCount || 0} existing user(s) initialized with emailVerified: false.`
    );

    return {
      verifiedAdmins: adminRes.modifiedCount || 0,
      modifiedUsers: userRes.modifiedCount || 0,
    };
  } finally {
    if (shouldDisconnect) {
      await mongoose.disconnect();
      console.log('[Migration] Disconnected from MongoDB.');
    }
  }
}

// Run standalone if executed directly via `node migrateEmailVerification.js`
if (require.main === module) {
  migrateEmailVerification()
    .then(() => {
      console.log('[Migration] Script finished successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Migration] Failed:', err);
      process.exit(1);
    });
}

module.exports = { migrateEmailVerification };
