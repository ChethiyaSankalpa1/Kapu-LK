const mongoose = require('mongoose');
const User = require('../models/User');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const RefreshToken = require('../models/RefreshToken');
const { Wallet, WalletTransaction, PaymentRequest } = require('../models/Wallet');
const PremiumPaymentRequest = require('../models/PremiumPaymentRequest');
const { UserStats } = require('../models/Achievement');
const { Redemption } = require('../models/Redemption');
const Referral = require('../models/Referral');
const Report = require('../models/Report');
const Gift = require('../models/Gift');
const cloudinary = require('../config/cloudinary');
const { logAuditEvent } = require('../middleware/auditLogger');

// Constants (in milliseconds)
const DAY_MS = 24 * 60 * 60 * 1000;
const INACTIVITY_LIMIT_DAYS = 10;
const WARNING_5D_DAYS = 5; // 5 days remaining (after 5 days of inactivity)
const WARNING_2D_DAYS = 8; // 2 days remaining (after 8 days of inactivity)
const WARNING_1D_DAYS = 9; // 1 day remaining (after 9 days of inactivity)

/**
 * Extracts Cloudinary public ID from an image URL
 */
const extractCloudinaryPublicId = (url) => {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) return null;
  try {
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return null;
    const pathAfterUpload = parts.slice(uploadIndex + 2).join('/'); // skip version tag
    return pathAfterUpload.replace(/\.[^/.]+$/, ''); // remove file extension
  } catch (err) {
    return null;
  }
};

/**
 * Permanently deletes a user and ALL associated data (zero orphan records)
 */
const purgeUserPermanently = async (userId, reason = 'INACTIVITY_10_DAYS') => {
  const user = await User.findById(userId);
  if (!user) return { success: false, message: 'User not found' };

  // Never delete administrators automatically
  if (user.role === 'admin') {
    return { success: false, message: 'Administrators cannot be automatically purged' };
  }

  const purgedStats = {
    userId,
    userName: user.name,
    email: user.email,
    imagesDestroyed: 0,
    messagesDeleted: 0,
    notificationsDeleted: 0,
    tokensRevoked: 0,
    walletDeleted: false,
    timestamp: new Date(),
  };

  // 1. Destroy Cloudinary profile image
  if (user.profileImageUrl) {
    const publicId = extractCloudinaryPublicId(user.profileImageUrl);
    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId);
        purgedStats.imagesDestroyed += 1;
      } catch (e) {
        console.warn('Failed to delete avatar from Cloudinary:', e.message);
      }
    }
  }

  // 2. Find and destroy Cloudinary images sent in chat
  try {
    const chatImages = await Message.find({
      from: userId,
      type: 'image',
    }).select('content contentIv');

    for (const msg of chatImages) {
      const publicId = extractCloudinaryPublicId(msg.content);
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId);
          purgedStats.imagesDestroyed += 1;
        } catch (e) {
          console.warn('Failed to delete chat image from Cloudinary:', e.message);
        }
      }
    }
  } catch (e) {
    console.warn('Error querying chat images for purge:', e.message);
  }

  // 3. Cascade delete all child collections
  const msgResult = await Message.deleteMany({
    $or: [{ from: userId }, { to: userId }],
  });
  purgedStats.messagesDeleted = msgResult.deletedCount || 0;

  const notifResult = await Notification.deleteMany({
    $or: [{ user: userId }, { relatedUser: userId }],
  });
  purgedStats.notificationsDeleted = notifResult.deletedCount || 0;

  const tokenResult = await RefreshToken.deleteMany({ user: userId });
  purgedStats.tokensRevoked = tokenResult.deletedCount || 0;

  await Wallet.deleteMany({ user: userId });
  await WalletTransaction.deleteMany({ user: userId });
  await PaymentRequest.deleteMany({ user: userId });
  await PremiumPaymentRequest.deleteMany({ user: userId });
  await UserStats.deleteMany({ user: userId });
  await Redemption.deleteMany({ user: userId });
  await Referral.deleteMany({
    $or: [{ referrer: userId }, { referredUser: userId }],
  });
  await Report.deleteMany({
    $or: [{ reporter: userId }, { reportedUser: userId }],
  });
  await Gift.deleteMany({
    $or: [{ sender: userId }, { recipient: userId }],
  });

  // 4. Remove user from blocked lists across other users
  await User.updateMany(
    { blockedUsers: userId },
    { $pull: { blockedUsers: userId } }
  );

  // 5. Delete user document
  await User.findByIdAndDelete(userId);

  // 6. Log audit event
  logAuditEvent({
    userId,
    action: 'USER_PERMANENTLY_PURGED',
    targetId: userId,
    targetType: 'User',
    details: {
      reason,
      purgedStats,
    },
  });

  console.log(`[InactivityCleanup] Permanently purged user: ${user.name} (${user.email}). Stats:`, purgedStats);
  return { success: true, purgedStats };
};

/**
 * Runs warning notifications and permanent purge checks for inactive accounts
 */
const runInactivityChecks = async () => {
  const now = Date.now();
  const summary = {
    warnings5d: 0,
    warnings2d: 0,
    warnings1d: 0,
    purged: 0,
    checkedAt: new Date(),
  };

  try {
    // 1. Process 1-Day Remaining Warning (inactive >= 9 days, < 10 days)
    const threshold1d = new Date(now - WARNING_1D_DAYS * DAY_MS);
    const thresholdPurge = new Date(now - INACTIVITY_LIMIT_DAYS * DAY_MS);

    const users1d = await User.find({
      role: { $ne: 'admin' },
      lastActiveAt: mongoose.trusted({ $lte: threshold1d, $gt: thresholdPurge }),
      'inactivityWarningsSent.d1': { $ne: true },
    });

    for (const user of users1d) {
      await Notification.create({
        user: user._id,
        type: 'system',
        message: 'Final 24-Hour Notice: Your account will be permanently deleted in 24 hours due to inactivity. Log in or browse to cancel deletion.',
      });
      user.inactivityWarningsSent = user.inactivityWarningsSent || {};
      user.inactivityWarningsSent.d1 = true;
      user.inactivityWarningsSent.d2 = true;
      user.inactivityWarningsSent.d5 = true;
      await user.save();
      summary.warnings1d += 1;
    }

    // 2. Process 2-Days Remaining Warning (inactive >= 8 days, < 9 days)
    const threshold2d = new Date(now - WARNING_2D_DAYS * DAY_MS);
    const users2d = await User.find({
      role: { $ne: 'admin' },
      lastActiveAt: mongoose.trusted({ $lte: threshold2d, $gt: threshold1d }),
      'inactivityWarningsSent.d2': { $ne: true },
    });

    for (const user of users2d) {
      await Notification.create({
        user: user._id,
        type: 'system',
        message: 'Urgent Warning: Your account has been inactive for 8 days and will be permanently deleted in 2 days. Any login or browsing will immediately cancel deletion.',
      });
      user.inactivityWarningsSent = user.inactivityWarningsSent || {};
      user.inactivityWarningsSent.d2 = true;
      user.inactivityWarningsSent.d5 = true;
      await user.save();
      summary.warnings2d += 1;
    }

    // 3. Process 5-Days Remaining Warning (inactive >= 5 days, < 8 days)
    const threshold5d = new Date(now - WARNING_5D_DAYS * DAY_MS);
    const users5d = await User.find({
      role: { $ne: 'admin' },
      lastActiveAt: mongoose.trusted({ $lte: threshold5d, $gt: threshold2d }),
      'inactivityWarningsSent.d5': { $ne: true },
    });

    for (const user of users5d) {
      await Notification.create({
        user: user._id,
        type: 'system',
        message: 'Notice: Your account has been inactive for 5 days. Due to our 10-day inactivity policy, accounts inactive for 10 days are permanently deleted. Log in to keep your account active (5 days remaining).',
      });
      user.inactivityWarningsSent = user.inactivityWarningsSent || {};
      user.inactivityWarningsSent.d5 = true;
      await user.save();
      summary.warnings5d += 1;
    }

    // 4. Execute Permanent Cascade Purge (inactive >= 10 days)
    const expiredUsers = await User.find({
      role: { $ne: 'admin' },
      lastActiveAt: mongoose.trusted({ $lte: thresholdPurge }),
    });

    for (const user of expiredUsers) {
      await purgeUserPermanently(user._id, 'INACTIVITY_10_DAYS');
      summary.purged += 1;
    }

    console.log('[InactivityCleanup] Cycle completed:', summary);
  } catch (error) {
    console.error('[InactivityCleanup] Error running inactivity checks:', error);
  }

  return summary;
};

/**
 * Retrieve current inactivity metrics and status for admin dashboard
 */
const getInactivityStatus = async () => {
  const now = Date.now();
  const threshold5d = new Date(now - WARNING_5D_DAYS * DAY_MS);
  const threshold2d = new Date(now - WARNING_2D_DAYS * DAY_MS);
  const threshold1d = new Date(now - WARNING_1D_DAYS * DAY_MS);
  const thresholdPurge = new Date(now - INACTIVITY_LIMIT_DAYS * DAY_MS);

  const [count5d, count2d, count1d, countPendingPurge, totalUsers] = await Promise.all([
    User.countDocuments({
      role: { $ne: 'admin' },
      lastActiveAt: mongoose.trusted({ $lte: threshold5d, $gt: threshold2d }),
    }),
    User.countDocuments({
      role: { $ne: 'admin' },
      lastActiveAt: mongoose.trusted({ $lte: threshold2d, $gt: threshold1d }),
    }),
    User.countDocuments({
      role: { $ne: 'admin' },
      lastActiveAt: mongoose.trusted({ $lte: threshold1d, $gt: thresholdPurge }),
    }),
    User.countDocuments({
      role: { $ne: 'admin' },
      lastActiveAt: mongoose.trusted({ $lte: thresholdPurge }),
    }),
    User.countDocuments({ role: { $ne: 'admin' } }),
  ]);

  return {
    inactivityPeriodDays: INACTIVITY_LIMIT_DAYS,
    warningScheduleDays: [WARNING_5D_DAYS, WARNING_2D_DAYS, WARNING_1D_DAYS],
    usersInWarningTier5d: count5d,
    usersInWarningTier2d: count2d,
    usersInWarningTier1d: count1d,
    usersPendingPurge: countPendingPurge,
    totalActiveUsersTracked: totalUsers,
    lastChecked: new Date(),
  };
};

/**
 * Starts background timer for inactivity cleanup (runs hourly)
 */
let timerId = null;
const startInactivityScheduler = (intervalMs = 3600000) => {
  if (timerId) clearInterval(timerId);
  // Run once on startup after 10 seconds
  setTimeout(() => {
    runInactivityChecks().catch((e) => console.error('Initial inactivity check failed:', e));
  }, 10000);

  timerId = setInterval(() => {
    runInactivityChecks().catch((e) => console.error('Scheduled inactivity check failed:', e));
  }, intervalMs);

  console.log(`[InactivityCleanup] Scheduler initialized. Runs every ${intervalMs / 1000}s`);
};

module.exports = {
  purgeUserPermanently,
  runInactivityChecks,
  getInactivityStatus,
  startInactivityScheduler,
};
