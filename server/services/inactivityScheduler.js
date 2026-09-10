/**
 * Kapu-LK Inactivity Lifecycle Scheduler
 *
 * Rules:
 * 1. Tracks member activity via `lastActiveAt`.
 * 2. After 6 consecutive days of inactivity:
 *    - Sends 1 gentle reminder email warning that 4 days remain.
 *    - Records `inactivityReminderSentAt = new Date()` to prevent duplicate reminder emails.
 * 3. If user returns and logs in before day 10:
 *    - `lastActiveAt` resets to Date.now() and `inactivityReminderSentAt` resets to null.
 * 4. After 10 consecutive days of inactivity:
 *    - Automatically deactivates the account (accountStatus: 'deactivated', isActive: false).
 *    - Revokes active sessions / refresh tokens.
 *    - Sends an informative notification email explaining how to reactivate by simply signing in.
 * 5. ADMIN PROTECTION:
 *    - The admin account (role: 'admin') is NEVER deactivated or emailed.
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const { sendInactivityReminderEmail, sendAccountDeactivatedEmail } = require('./emailService');
const { logAuditEvent } = require('../middleware/auditLogger');

const DAY_MS = 24 * 60 * 60 * 1000;
const INACTIVITY_REMINDER_DAYS = 6;
const INACTIVITY_DEACTIVATE_DAYS = 10;

let schedulerTimer = null;

/**
 * Execute a single cycle of inactivity checks (Idempotent and safe to run frequently)
 */
async function runInactivityLifecycleChecks() {
  const now = Date.now();
  const summary = {
    remindersSent: 0,
    deactivationsProcessed: 0,
    timestamp: new Date(),
  };

  try {
    const threshold6d = new Date(now - INACTIVITY_REMINDER_DAYS * DAY_MS);
    const threshold10d = new Date(now - INACTIVITY_DEACTIVATE_DAYS * DAY_MS);

    // -------------------------------------------------------------
    // 1. Process 6-Day Inactivity Reminders (Inactive between 6 and 10 days)
    // -------------------------------------------------------------
    const usersNeedingReminder = await User.find({
      role: mongoose.trusted({ $ne: 'admin' }),
      accountStatus: 'active',
      lastActiveAt: mongoose.trusted({ $lte: threshold6d, $gt: threshold10d }),
      inactivityReminderSentAt: null,
    }).select('name email lastActiveAt');

    for (const user of usersNeedingReminder) {
      // Calculate days remaining until 10 days
      const daysInactive = Math.floor((now - new Date(user.lastActiveAt).getTime()) / DAY_MS);
      const daysRemaining = Math.max(1, INACTIVITY_DEACTIVATE_DAYS - daysInactive);

      // Atomic update to mark reminder sent and prevent race condition
      const updateResult = await User.updateOne(
        { _id: user._id, inactivityReminderSentAt: null },
        { $set: { inactivityReminderSentAt: new Date() } }
      );

      if (updateResult.modifiedCount > 0) {
        // Send email non-blockingly
        await sendInactivityReminderEmail({
          to: user.email,
          name: user.name,
          daysRemaining,
        });

        summary.remindersSent += 1;
        logAuditEvent({
          userId: user._id,
          action: 'INACTIVITY_REMINDER_SENT',
          details: { daysRemaining, daysInactive },
        });
      }
    }

    // -------------------------------------------------------------
    // 2. Process 10-Day Automatic Deactivations (Inactive >= 10 days)
    // -------------------------------------------------------------
    const usersToDeactivate = await User.find({
      role: mongoose.trusted({ $ne: 'admin' }),
      accountStatus: 'active',
      lastActiveAt: mongoose.trusted({ $lte: threshold10d }),
    }).select('name email');

    for (const user of usersToDeactivate) {
      // Atomic state change
      const updateResult = await User.updateOne(
        { _id: user._id, accountStatus: 'active' },
        {
          $set: {
            accountStatus: 'deactivated',
            isActive: false,
            deactivatedAt: new Date(),
            deactivationReason: 'inactivity_10_days',
          },
        }
      );

      if (updateResult.modifiedCount > 0) {
        // Revoke active refresh tokens
        await RefreshToken.updateMany({ user: user._id }, { isRevoked: true });

        // Send deactivation notification email
        await sendAccountDeactivatedEmail({
          to: user.email,
          name: user.name,
        });

        summary.deactivationsProcessed += 1;
        logAuditEvent({
          userId: user._id,
          action: 'ACCOUNT_DEACTIVATED_INACTIVITY',
          severity: 'warning',
          details: { reason: 'inactivity_10_days' },
        });
      }
    }

    if (summary.remindersSent > 0 || summary.deactivationsProcessed > 0) {
      console.log(
        `[InactivityScheduler] Cycle complete: ${summary.remindersSent} reminder(s) sent, ${summary.deactivationsProcessed} account(s) deactivated.`
      );
    }
  } catch (err) {
    console.error('[InactivityScheduler] Error executing lifecycle checks:', err.message);
  }

  return summary;
}

/**
 * Start the background timer for inactivity checks
 * Defaults to running every 12 hours (43,200,000 ms)
 */
function startInactivityScheduler(intervalMs = 12 * 60 * 60 * 1000) {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
  }

  // Run initial check on boot after a 10-second stabilization delay
  setTimeout(() => {
    runInactivityLifecycleChecks().catch((err) => {
      console.warn('[InactivityScheduler] Initial check skipped:', err.message);
    });
  }, 10000);

  schedulerTimer = setInterval(() => {
    runInactivityLifecycleChecks().catch((err) => {
      console.warn('[InactivityScheduler] Recurring check failed:', err.message);
    });
  }, intervalMs);

  if (schedulerTimer.unref) {
    schedulerTimer.unref();
  }

  console.log(`[InactivityScheduler] Background scheduler initialized (interval: ${intervalMs / 1000}s).`);
}

function stopInactivityScheduler() {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
  }
}

module.exports = {
  runInactivityLifecycleChecks,
  startInactivityScheduler,
  stopInactivityScheduler,
};
