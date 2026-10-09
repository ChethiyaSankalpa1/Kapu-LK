const mongoose = require('mongoose');
const User = require('../models/User');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const RefreshToken = require('../models/RefreshToken');
const { Wallet, WalletTransaction, PaymentRequest } = require('../models/Wallet');
const PremiumPaymentRequest = require('../models/PremiumPaymentRequest');
const { UserStats } = require('../models/Achievement');
const { Redemption } = require('../models/Redemption');
const { Referral } = require('../models/Referral');
const Report = require('../models/Report');
const { GiftTransaction } = require('../models/Gift');
const cloudinary = require('../config/cloudinary');
const { logAuditEvent } = require('../middleware/auditLogger');

// Constants (in milliseconds)
const DAY_MS = 24 * 60 * 60 * 1000;
const INACTIVITY_LIMIT_DAYS = 10;
const WARNING_5D_DAYS = 5; // 5 days remaining (after 5 days of inactivity)
const WARNING_2D_DAYS = 8; // 2 days remaining (after 8 days of inactivity)
const WARNING_1D_DAYS = 9; // 1 day remaining (after 9 days of inactivity)

const eligibleUserFilter = () => ({
  role: mongoose.trusted({ $ne: 'admin' }),
  isPremium: mongoose.trusted({ $ne: true }),
  isDemoAccount: mongoose.trusted({ $ne: true }),
  accountStatus: 'active',
  isActive: mongoose.trusted({ $ne: false }),
});

const inactivityWindow = (minimumDays, maximumDays = null, now = Date.now()) => {
  const filter = { $lte: new Date(now - minimumDays * DAY_MS) };
  if (maximumDays !== null) {
    filter.$gt = new Date(now - maximumDays * DAY_MS);
  }
  return filter;
};

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

  // Never delete administrators or premium users automatically
  if (user.role === 'admin' || user.isPremium) {
    return { success: false, message: 'Administrators and Premium users cannot be automatically purged' };
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
  await GiftTransaction.deleteMany({
    $or: [{ from: userId }, { to: userId }],
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
    skipped: 0,
    errors: 0,
    checkedAt: new Date(),
  };

  try {
    const users1d = await User.find({
      ...eligibleUserFilter(),
      lastActiveAt: mongoose.trusted(inactivityWindow(WARNING_1D_DAYS, INACTIVITY_LIMIT_DAYS, now)),
      'inactivityWarningsSent.d1': mongoose.trusted({ $ne: true }),
    });

    for (const user of users1d) {
      const claimed = await User.findOneAndUpdate(
        { _id: user._id, ...eligibleUserFilter(), lastActiveAt: mongoose.trusted(inactivityWindow(WARNING_1D_DAYS, INACTIVITY_LIMIT_DAYS, now)), 'inactivityWarningsSent.d1': mongoose.trusted({ $ne: true }) },
        { $set: { 'inactivityWarningsSent.d1': true } },
        { new: true }
      );
      if (!claimed) {
        summary.skipped += 1;
        console.log(`[InactivityCleanup] Skipped final warning for ${user._id}: activity or another run changed the record.`);
        continue;
      }
      try {
        await Notification.create({ user: user._id, type: 'system', message: 'Final 24-Hour Notice: Your account will be permanently deleted in 24 hours due to inactivity. Log in or browse to cancel deletion.' });
        summary.warnings1d += 1;
        console.log(`[InactivityCleanup] Sent final warning to ${user._id}.`);
      } catch (error) {
        summary.errors += 1;
        console.error(`[InactivityCleanup] Final warning failed for ${user._id}:`, error.message);
      }
    }

    const users2d = await User.find({
      ...eligibleUserFilter(),
      lastActiveAt: mongoose.trusted(inactivityWindow(WARNING_2D_DAYS, WARNING_1D_DAYS, now)),
      'inactivityWarningsSent.d2': mongoose.trusted({ $ne: true }),
    });

    for (const user of users2d) {
      const claimed = await User.findOneAndUpdate(
        { _id: user._id, ...eligibleUserFilter(), lastActiveAt: mongoose.trusted(inactivityWindow(WARNING_2D_DAYS, WARNING_1D_DAYS, now)), 'inactivityWarningsSent.d2': mongoose.trusted({ $ne: true }) },
        { $set: { 'inactivityWarningsSent.d2': true } },
        { new: true }
      );
      if (!claimed) {
        summary.skipped += 1;
        console.log(`[InactivityCleanup] Skipped 2-day warning for ${user._id}: activity or another run changed the record.`);
        continue;
      }
      try {
        await Notification.create({ user: user._id, type: 'system', message: 'Urgent Warning: Your account has been inactive for 8 days and will be permanently deleted in 2 days. Any login or browsing will immediately cancel deletion.' });
        summary.warnings2d += 1;
        console.log(`[InactivityCleanup] Sent 2-day warning to ${user._id}.`);
      } catch (error) {
        summary.errors += 1;
        console.error(`[InactivityCleanup] 2-day warning failed for ${user._id}:`, error.message);
      }
    }

    const users5d = await User.find({
      ...eligibleUserFilter(),
      lastActiveAt: mongoose.trusted(inactivityWindow(WARNING_5D_DAYS, WARNING_2D_DAYS, now)),
      'inactivityWarningsSent.d5': mongoose.trusted({ $ne: true }),
    });

    for (const user of users5d) {
      const claimed = await User.findOneAndUpdate(
        { _id: user._id, ...eligibleUserFilter(), lastActiveAt: mongoose.trusted(inactivityWindow(WARNING_5D_DAYS, WARNING_2D_DAYS, now)), 'inactivityWarningsSent.d5': mongoose.trusted({ $ne: true }) },
        { $set: { 'inactivityWarningsSent.d5': true } },
        { new: true }
      );
      if (!claimed) {
        summary.skipped += 1;
        console.log(`[InactivityCleanup] Skipped 5-day warning for ${user._id}: activity or another run changed the record.`);
        continue;
      }
      try {
        await Notification.create({ user: user._id, type: 'system', message: 'Notice: Your account has been inactive for 5 days. Due to our 10-day inactivity policy, accounts inactive for 10 days are permanently deleted. Log in to keep your account active (5 days remaining).' });
        summary.warnings5d += 1;
        console.log(`[InactivityCleanup] Sent 5-day warning to ${user._id}.`);
      } catch (error) {
        summary.errors += 1;
        console.error(`[InactivityCleanup] 5-day warning failed for ${user._id}:`, error.message);
      }
    }

    const expiredUsers = await User.find({
      ...eligibleUserFilter(),
      lastActiveAt: mongoose.trusted(inactivityWindow(INACTIVITY_LIMIT_DAYS, null, now)),
    });

    for (const user of expiredUsers) {
      const latestUser = await User.findOne({
        _id: user._id,
        ...eligibleUserFilter(),
        lastActiveAt: mongoose.trusted(inactivityWindow(INACTIVITY_LIMIT_DAYS, null)),
      }).select('_id');
      if (!latestUser) {
        summary.skipped += 1;
        console.log(`[InactivityCleanup] Skipped purge for ${user._id}: user became active or is no longer eligible.`);
        continue;
      }
      try {
        const result = await purgeUserPermanently(user._id, 'INACTIVITY_10_DAYS');
        if (result.success) summary.purged += 1;
        else summary.skipped += 1;
      } catch (error) {
        summary.errors += 1;
        console.error(`[InactivityCleanup] Purge failed for ${user._id}:`, error.message);
      }
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
  const [count5d, count2d, count1d, countPendingPurge, totalUsers] = await Promise.all([
    User.countDocuments({ ...eligibleUserFilter(), lastActiveAt: mongoose.trusted(inactivityWindow(WARNING_5D_DAYS, WARNING_2D_DAYS, now)) }),
    User.countDocuments({ ...eligibleUserFilter(), lastActiveAt: mongoose.trusted(inactivityWindow(WARNING_2D_DAYS, WARNING_1D_DAYS, now)) }),
    User.countDocuments({ ...eligibleUserFilter(), lastActiveAt: mongoose.trusted(inactivityWindow(WARNING_1D_DAYS, INACTIVITY_LIMIT_DAYS, now)) }),
    User.countDocuments({ ...eligibleUserFilter(), lastActiveAt: mongoose.trusted(inactivityWindow(INACTIVITY_LIMIT_DAYS, null, now)) }),
    User.countDocuments(eligibleUserFilter()),
  ]);

  return {
    inactivityPeriodDays: INACTIVITY_LIMIT_DAYS,
    warningScheduleDays: [WARNING_5D_DAYS, WARNING_2D_DAYS, WARNING_1D_DAYS],
    usersInWarningTier5d: count5d,
    usersInWarningTier2d: count2d,
    usersInWarningTier1d: count1d,
    usersPendingPurge: countPendingPurge,
    pendingPurgeCount: countPendingPurge,
    warning1dCount: count1d,
    warning2dCount: count2d,
    warning5dCount: count5d,
    inactiveUsersCount: count5d + count2d + count1d + countPendingPurge,
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
  eligibleUserFilter,
  inactivityWindow,
  startInactivityScheduler,
};
