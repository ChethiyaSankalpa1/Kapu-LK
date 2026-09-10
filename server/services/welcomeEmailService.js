const User = require('../models/User');
const { sendWelcomeEmail } = require('./emailService');

/**
 * Checks if a user's profile has met all completion criteria
 */
function isProfileComplete(user) {
  if (!user) return false;
  const p = user.partnerPreferences || {};
  return Boolean(
    (user.profileImageUrl || user.profileImage) &&
    user.age &&
    user.gender &&
    (user.district || user.location) &&
    (user.education || '').length > 0 &&
    (user.occupation || user.workplace) &&
    (user.maritalStatus || '').length > 0 &&
    (user.religion || '').length > 0 &&
    (user.bio || '').trim().length > 0 &&
    p.minAge &&
    p.maxAge &&
    (p.religion || '').length > 0 &&
    (p.district || '').length > 0 &&
    (p.education || '').length > 0 &&
    (p.maritalStatus || '').length > 0
  );
}

/**
 * Checks if the user qualifies for the welcome email:
 * 1. Email is verified (`emailVerified === true`).
 * 2. Profile is complete (`isProfileComplete(user) === true`).
 * 3. Welcome email was not previously sent (`welcomeEmailSentAt === null`).
 *
 * Uses an atomic MongoDB findOneAndUpdate to guarantee strict deduplication.
 */
async function checkAndSendWelcomeEmail(userId) {
  try {
    const user = await User.findById(userId);
    if (!user || user.role === 'admin') return { sent: false, reason: 'exempt_or_not_found' };

    // Strict requirements: verified email + profile complete + not previously sent
    if (!user.emailVerified) {
      return { sent: false, reason: 'email_not_verified' };
    }
    if (user.welcomeEmailSentAt) {
      return { sent: false, reason: 'already_sent' };
    }
    if (!isProfileComplete(user)) {
      return { sent: false, reason: 'profile_incomplete' };
    }

    // Atomic update to lock and prevent duplicate sends across concurrent requests
    const updated = await User.findOneAndUpdate(
      { _id: user._id, welcomeEmailSentAt: null, emailVerified: true },
      { $set: { welcomeEmailSentAt: new Date() } },
      { new: false }
    );

    if (updated && !updated.welcomeEmailSentAt) {
      await sendWelcomeEmail({
        to: user.email,
        name: user.name,
      });
      console.log(`[WelcomeEmail] Welcome email sent successfully to ${user.email}`);
      return { sent: true };
    }

    return { sent: false, reason: 'already_sent_race' };
  } catch (err) {
    console.error('[WelcomeEmail] Error in checkAndSendWelcomeEmail:', err.message);
    return { sent: false, error: err.message };
  }
}

module.exports = {
  isProfileComplete,
  checkAndSendWelcomeEmail,
};
