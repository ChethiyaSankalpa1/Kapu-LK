const Message = require('../models/Message');

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

/**
 * Deletes ALL messages from the database on a fixed interval.
 * Use this only for development / student project requirements.
 */
const startMessageCleanup = ({ intervalMs = SIX_HOURS_MS } = {}) => {
  let running = false;

  const runOnce = async () => {
    if (running) return;
    running = true;
    try {
      const result = await Message.deleteMany({});
      const deleted = result?.deletedCount ?? 0;
      console.log(`[messageCleanup] Deleted ${deleted} messages`);
    } catch (err) {
      console.error('[messageCleanup] Failed to delete messages:', err.message);
    } finally {
      running = false;
    }
  };

  // Run periodically
  const timer = setInterval(runOnce, intervalMs);
  timer.unref?.();

  // Don't delete immediately on boot (safer), but keep a helper if needed later.
  return { stop: () => clearInterval(timer), runOnce };
};

module.exports = { startMessageCleanup };

