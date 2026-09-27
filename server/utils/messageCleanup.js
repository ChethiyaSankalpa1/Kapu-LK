const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const { getUserPremiumDetails } = require('./entitlements');

const FREE_RETENTION_MS = 36 * 60 * 60 * 1000;    // 36 Hours
const PREMIUM_RETENTION_MS = 48 * 60 * 60 * 1000; // 48 Hours (2 Days)
const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

/**
 * Extracts Cloudinary public ID from a URL safely
 */
const extractCloudinaryPublicId = (url) => {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) return null;
  try {
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return null;
    const pathAfterUpload = parts.slice(uploadIndex + 2).join('/');
    return pathAfterUpload.replace(/\.[^/.]+$/, '');
  } catch (err) {
    return null;
  }
};

/**
 * Backfills expiresAt field for old messages that do not have expiresAt set yet.
 * Ensures existing messages created within the last 36h/48h are retained properly.
 */
const backfillMessageExpiresAt = async () => {
  try {
    const messagesWithoutExpiry = await Message.find(mongoose.trusted({
      $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }],
    }))
      .limit(1000)
      .select('_id from to createdAt');

    if (messagesWithoutExpiry.length === 0) return 0;

    console.log(`[messageCleanup] Backfilling expiresAt for ${messagesWithoutExpiry.length} legacy messages...`);

    // Cache user premium statuses during backfill batch
    const userMap = new Map();

    const getUserIsPremium = async (userId) => {
      const key = userId.toString();
      if (userMap.has(key)) return userMap.get(key);
      const user = await User.findById(userId).select('role isPremium premiumPlan premiumExpiresAt premiumStatus');
      const isPrem = Boolean(user && getUserPremiumDetails(user).isPremium);
      userMap.set(key, isPrem);
      return isPrem;
    };

    let backfilledCount = 0;
    const bulkOps = [];

    for (const msg of messagesWithoutExpiry) {
      const fromIsPremium = await getUserIsPremium(msg.from);
      const toIsPremium = await getUserIsPremium(msg.to);
      const isPremiumConvo = fromIsPremium || toIsPremium;

      const retentionMs = isPremiumConvo ? PREMIUM_RETENTION_MS : FREE_RETENTION_MS;
      const createdAtMs = new Date(msg.createdAt || Date.now()).getTime();
      const expiresAt = new Date(createdAtMs + retentionMs);

      bulkOps.push({
        updateOne: {
          filter: { _id: msg._id },
          update: { $set: { expiresAt } },
        },
      });

      backfilledCount++;
    }

    if (bulkOps.length > 0) {
      await Message.bulkWrite(bulkOps);
    }

    console.log(`[messageCleanup] Successfully backfilled ${backfilledCount} legacy messages with expiresAt.`);
    return backfilledCount;
  } catch (err) {
    console.error('[messageCleanup] Error during expiresAt backfill:', err.message);
    return 0;
  }
};

/**
 * Safely cleans up external Cloudinary attachments associated with expired messages.
 * NEVER deletes profile images or photos referenced in User records!
 */
const cleanupExpiredMessageMedia = async () => {
  try {
    const now = new Date();
    const expiredImageMessages = await Message.find(mongoose.trusted({
      expiresAt: { $lte: now },
      type: 'image',
    })).select('_id content');

    if (expiredImageMessages.length === 0) return 0;

    let destroyedCount = 0;

    for (const msg of expiredImageMessages) {
      const publicId = extractCloudinaryPublicId(msg.content);
      if (!publicId) continue;

      // SAFEGUARD: Check if this Cloudinary URL / public ID is still referenced anywhere in User profile photos
      const isReferencedInProfiles = await User.exists({
        $or: [
          { profileImageUrl: { $regex: publicId } },
          { 'photos.url': { $regex: publicId } },
          { 'photos.publicId': publicId },
        ],
      });

      if (!isReferencedInProfiles) {
        try {
          await cloudinary.uploader.destroy(publicId);
          destroyedCount++;
        } catch (cloudinaryErr) {
          console.warn(`[messageCleanup] Failed to destroy Cloudinary image ${publicId}:`, cloudinaryErr.message);
        }
      }
    }

    if (destroyedCount > 0) {
      console.log(`[messageCleanup] Cleaned up ${destroyedCount} Cloudinary chat media attachment(s) for expired messages.`);
    }

    // Explicitly delete expired messages from MongoDB (complements MongoDB TTL index)
    const deleteResult = await Message.deleteMany({ expiresAt: { $lte: now } });
    const deletedDocs = deleteResult?.deletedCount ?? 0;
    if (deletedDocs > 0) {
      console.log(`[messageCleanup] Purged ${deletedDocs} expired message(s) from MongoDB.`);
    }

    return deletedDocs;
  } catch (err) {
    console.error('[messageCleanup] Error during media cleanup:', err.message);
    return 0;
  }
};

/**
 * Initializes automatic message retention and cleanup subsystem
 */
const startMessageCleanup = ({ intervalMs = FIFTEEN_MINUTES_MS } = {}) => {
  let running = false;

  const runCycle = async () => {
    if (running) return;
    running = true;
    try {
      await backfillMessageExpiresAt();
      await cleanupExpiredMessageMedia();
    } catch (err) {
      console.error('[messageCleanup] Cycle execution error:', err.message);
    } finally {
      running = false;
    }
  };

  // Run initial cycle on boot
  runCycle();

  // Schedule periodic cleanup
  const timer = setInterval(runCycle, intervalMs);
  timer.unref?.();

  return { stop: () => clearInterval(timer), runCycle, backfillMessageExpiresAt };
};

module.exports = {
  startMessageCleanup,
  backfillMessageExpiresAt,
  cleanupExpiredMessageMedia,
  FREE_RETENTION_MS,
  PREMIUM_RETENTION_MS,
};
