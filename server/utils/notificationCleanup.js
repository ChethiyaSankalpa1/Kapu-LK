const Notification = require('../models/Notification');

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Cleans up notifications to keep the notification center organized.
 * - Deletes read notifications older than 6 hours
 * - Deletes all notifications older than 30 days
 * - Runs every 6 hours
 */
const startNotificationCleanup = ({ intervalMs = SIX_HOURS_MS } = {}) => {
  let running = false;

  const runOnce = async () => {
    if (running) return;
    running = true;
    try {
      const sixHoursAgo = new Date(Date.now() - SIX_HOURS_MS);
      const thirtyDaysAgo = new Date(Date.now() - THIRTY_DAYS_MS);

      // Delete read notifications older than 6 hours
      const readResult = await Notification.deleteMany({
        isRead: true,
        createdAt: { $lt: sixHoursAgo }
      });

      // Delete all notifications older than 30 days
      const oldResult = await Notification.deleteMany({
        createdAt: { $lt: thirtyDaysAgo }
      });

      const deletedRead = readResult?.deletedCount ?? 0;
      const deletedOld = oldResult?.deletedCount ?? 0;
      const totalDeleted = deletedRead + deletedOld;

      if (totalDeleted > 0) {
        console.log(`[notificationCleanup] Deleted ${deletedRead} read notifications (6h+) and ${deletedOld} old notifications (30d+)`);
      }
    } catch (err) {
      console.error('[notificationCleanup] Failed to delete notifications:', err.message);
    } finally {
      running = false;
    }
  };

  // Run periodically
  const timer = setInterval(runOnce, intervalMs);
  timer.unref?.();

  // Run once initially on boot
  runOnce();

  return { stop: () => clearInterval(timer), runOnce };
};

module.exports = { startNotificationCleanup };
