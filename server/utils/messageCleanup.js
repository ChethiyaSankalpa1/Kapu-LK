const Message = require('../models/Message');

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

const TEN_MINUTES_MS = 10 * 60 * 1000;

/**
 * Deletes messages older than 6 hours from the database on a fixed interval.
 */
const startMessageCleanup = ({ intervalMs = TEN_MINUTES_MS } = {}) => {
  let running = false;

  const runOnce = async () => {
    if (running) return;
    running = true;
    try {
      const cutoff = new Date(Date.now() - SIX_HOURS_MS);
      const result = await Message.collection.deleteMany({ createdAt: { $lt: cutoff } });
      const deleted = result?.deletedCount ?? 0;
      if (deleted > 0) {
        console.log(`[messageCleanup] Deleted ${deleted} messages older than 6 hours`);
      }
    } catch (err) {
      console.error('[messageCleanup] Failed to delete messages:', err.message);
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

module.exports = { startMessageCleanup };

