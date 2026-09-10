/**
 * Kapu-LK Branded Email Templates
 *
 * All user-supplied fields are strictly HTML-escaped.
 * Every template includes responsive HTML and plain-text fallbacks.
 */

const SUPPORT_EMAIL = 'kapulk.support@gmail.com';
const BRAND_NAME = 'Kapu-LK';

/**
 * Escape unsafe HTML characters to prevent XSS / HTML injection in email clients
 */
function escapeHtml(string) {
  if (string === null || string === undefined) return '';
  return String(string)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Base layout wrapper for consistent Kapu-LK purple & pink branding
 */
function wrapLayout({ title, previewText, contentHtml }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f8fafc;
      padding: 32px 16px;
      box-sizing: border-box;
    }
    .card {
      max-width: 580px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03);
      border: 1px solid #f1f5f9;
    }
    .header {
      background: linear-gradient(135deg, #7c3aed 0%, #c026d3 50%, #db2777 100%);
      padding: 36px 32px;
      text-align: center;
      color: #ffffff;
    }
    .brand-title {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin: 0 0 4px 0;
      text-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .brand-subtitle {
      font-size: 13px;
      font-weight: 500;
      opacity: 0.92;
      margin: 0;
      letter-spacing: 0.2px;
    }
    .content {
      padding: 36px 32px;
      line-height: 1.65;
      font-size: 15px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 0;
      margin-bottom: 16px;
    }
    .code-box {
      background: linear-gradient(135deg, #f5f3ff 0%, #fdf2f8 100%);
      border: 2px dashed #c084fc;
      border-radius: 16px;
      padding: 24px;
      text-align: center;
      margin: 28px 0;
    }
    .code-digit {
      font-family: 'Courier New', Courier, monospace;
      font-size: 36px;
      font-weight: 800;
      letter-spacing: 10px;
      color: #7c3aed;
      display: inline-block;
      padding-left: 10px;
    }
    .code-instruction {
      font-size: 13px;
      color: #64748b;
      margin: 8px 0 0 0;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #7c3aed 0%, #db2777 100%);
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 700;
      font-size: 15px;
      padding: 14px 32px;
      border-radius: 12px;
      box-shadow: 0 4px 14px rgba(124, 58, 237, 0.35);
      margin: 20px 0;
      text-align: center;
    }
    .safety-box {
      background-color: #fffbeb;
      border-left: 4px solid #f59e0b;
      border-radius: 8px;
      padding: 14px 18px;
      margin: 24px 0;
      font-size: 13px;
      color: #92400e;
      line-height: 1.5;
    }
    .safety-title {
      font-weight: 700;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .divider {
      border: 0;
      border-top: 1px solid #e2e8f0;
      margin: 28px 0;
    }
    .footer {
      background-color: #f8fafc;
      padding: 24px 32px;
      border-top: 1px solid #f1f5f9;
      font-size: 12px;
      color: #64748b;
      text-align: center;
      line-height: 1.6;
    }
    .footer a {
      color: #7c3aed;
      text-decoration: none;
      font-weight: 600;
    }
    .footer a:hover {
      text-decoration: underline;
    }
    @media only screen and (max-width: 600px) {
      .content { padding: 24px 20px; }
      .header { padding: 28px 20px; }
      .code-digit { font-size: 28px; letter-spacing: 6px; }
    }
  </style>
</head>
<body>
  <div style="display: none; max-height: 0px; overflow: hidden; opacity: 0;">
    ${escapeHtml(previewText)}
  </div>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <h1 class="brand-title">💍 ${BRAND_NAME}</h1>
        <p class="brand-subtitle">Sri Lanka's Trusted Matrimonial Platform</p>
      </div>
      <div class="content">
        ${contentHtml}
      </div>
      <div class="footer">
        <p style="margin: 0 0 8px 0;">Need assistance or have questions? Our support team is here to help:</p>
        <p style="margin: 0 0 12px 0;">
          <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>
        </p>
        <p style="margin: 0; color: #94a3b8; font-size: 11px;">
          &copy; ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * 1. Email Verification Code Template (New & Existing Members)
 */
function getEmailVerificationTemplate({ name, code, expiresMinutes = 15 }) {
  const safeName = escapeHtml(name || 'Member');
  const safeCode = escapeHtml(code);
  const safeMinutes = escapeHtml(expiresMinutes);

  const html = wrapLayout({
    title: 'Verify Your Kapu-LK Email Address',
    previewText: `Your verification code is ${safeCode}. Enter this code to verify your Kapu-LK account.`,
    contentHtml: `
      <h2 class="greeting">Hello ${safeName},</h2>
      <p>Thank you for joining <strong>Kapu-LK</strong>. To complete your account verification and secure your profile, please use the following 6-digit verification code:</p>
      
      <div class="code-box">
        <div class="code-digit">${safeCode}</div>
        <p class="code-instruction">This single-use code expires in <strong>${safeMinutes} minutes</strong>.</p>
      </div>

      <p>Enter this code on the verification screen to activate full access to Kapu-LK matchmaking features.</p>

      <div class="safety-box">
        <div class="safety-title">🔒 Security Advisory</div>
        Never share this verification code with anyone. Kapu-LK staff will never ask for your code or password.
      </div>

      <p style="font-size: 13px; color: #64748b; margin-top: 24px;">
        If you did not attempt to register or sign in to Kapu-LK, you can safely disregard this message or notify our support team at <a href="mailto:${SUPPORT_EMAIL}" style="color: #7c3aed;">${SUPPORT_EMAIL}</a>.
      </p>
    `,
  });

  const text = `Hello ${name || 'Member'},

Thank you for joining Kapu-LK. To complete your email verification, use this 6-digit verification code:

${code}

This single-use code expires in ${expiresMinutes} minutes.

Security Advisory: Never share this code with anyone. Kapu-LK staff will never ask for your code.
If you did not request this code, please ignore this email or contact ${SUPPORT_EMAIL}.

Support: ${SUPPORT_EMAIL}
© ${new Date().getFullYear()} Kapu-LK. All rights reserved.`;

  return { html, text, subject: `${code} is your Kapu-LK verification code` };
}

/**
 * 2. Welcome Email Template (Sent Once After Verification + Profile Completion)
 */
function getWelcomeEmailTemplate({ name, loginUrl = 'http://localhost:3000/login' }) {
  const safeName = escapeHtml(name || 'Member');
  const safeLoginUrl = escapeHtml(loginUrl);

  const html = wrapLayout({
    title: 'Welcome to Kapu-LK Matrimonial!',
    previewText: `Welcome to Kapu-LK, ${safeName}! Your profile setup is complete.`,
    contentHtml: `
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 48px;">🎉</span>
        <h2 class="greeting" style="font-size: 22px; margin-top: 12px; margin-bottom: 8px;">Welcome to the Family, ${safeName}!</h2>
        <p style="color: #64748b; font-size: 14px; margin: 0;">Your email verification and profile setup are successfully completed.</p>
      </div>

      <p>Congratulations! Your Kapu-LK profile is now fully active. You have taken the first meaningful step toward finding your lifelong partner within a verified, culturally respectful community.</p>

      <div style="background-color: #f5f3ff; border-radius: 12px; padding: 18px; margin: 24px 0;">
        <h4 style="margin: 0 0 8px 0; color: #6d28d9; font-size: 14px; font-weight: 700;">✨ Next Steps on Your Journey:</h4>
        <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #475569; line-height: 1.7;">
          <li>Explore curated matches tailored to your astrological and lifestyle preferences.</li>
          <li>Send respectful expressions of interest and secure in-app messages.</li>
          <li>Keep your partner preferences updated to receive the best match recommendations.</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 32px 0 24px 0;">
        <a href="${safeLoginUrl}" class="btn" target="_blank" rel="noopener noreferrer">
          Explore Matches Now &rarr;
        </a>
      </div>

      <div class="safety-box">
        <div class="safety-title">🛡️ Kapu-LK Safety Reminders</div>
        <ul style="margin: 4px 0 0 0; padding-left: 18px;">
          <li>Never transfer money, wire funds, or send financial aid to anyone you meet online.</li>
          <li>Keep your communications within the Kapu-LK platform until mutual trust is built.</li>
          <li>Involve family members and verify identities before making life commitments.</li>
        </ul>
      </div>

      <p style="font-size: 14px; color: #334155;">
        Warmest regards,<br>
        <strong>The Kapu-LK Support Team</strong><br>
        <a href="mailto:${SUPPORT_EMAIL}" style="color: #7c3aed; text-decoration: none;">${SUPPORT_EMAIL}</a>
      </p>
    `,
  });

  const text = `Welcome to Kapu-LK, ${name || 'Member'}!

Congratulations! Your email verification and profile setup are successfully completed.

Your Kapu-LK profile is now fully active. Start exploring matches today:
${loginUrl}

Safety Reminders:
- Never transfer money or send financial aid to anyone you meet online.
- Keep communications on Kapu-LK until mutual trust is established.
- Involve family members and verify identities before making commitments.

If you ever need support, we are here for you:
Email: ${SUPPORT_EMAIL}

Warm regards,
The Kapu-LK Support Team
© ${new Date().getFullYear()} Kapu-LK. All rights reserved.`;

  return { html, text, subject: 'Welcome to Kapu-LK — Your Profile is Ready!' };
}

/**
 * 3. Password Reset Code Template (Single-Use 6-Digit OTP)
 */
function getPasswordResetCodeTemplate({ name, code, expiresMinutes = 10 }) {
  const safeName = escapeHtml(name || 'Member');
  const safeCode = escapeHtml(code);
  const safeMinutes = escapeHtml(expiresMinutes);

  const html = wrapLayout({
    title: 'Reset Your Kapu-LK Password',
    previewText: `Your password reset code is ${safeCode}. Valid for ${safeMinutes} minutes.`,
    contentHtml: `
      <h2 class="greeting">Hello ${safeName},</h2>
      <p>We received a request to reset the password for your <strong>Kapu-LK</strong> account. Use the single-use 6-digit verification code below to proceed with resetting your password:</p>

      <div class="code-box">
        <div class="code-digit">${safeCode}</div>
        <p class="code-instruction">This code will expire in <strong>${safeMinutes} minutes</strong>.</p>
      </div>

      <p>Enter this code in the password reset form along with your new password.</p>

      <div class="safety-box">
        <div class="safety-title">⚠️ Security Notice</div>
        If you did not request a password reset, someone may have entered your email address by mistake. Your account remains secure and no changes have been made. Do not share this code with anyone.
      </div>

      <p style="font-size: 13px; color: #64748b;">
        If you suspect unauthorized access, please reach out to us immediately at <a href="mailto:${SUPPORT_EMAIL}" style="color: #7c3aed;">${SUPPORT_EMAIL}</a>.
      </p>
    `,
  });

  const text = `Hello ${name || 'Member'},

We received a request to reset your Kapu-LK password.
Your 6-digit verification code is:

${code}

This code will expire in ${expiresMinutes} minutes.

Security Notice: If you did not request this password reset, please ignore this email. Your account remains secure. Never share this code with anyone.

Support: ${SUPPORT_EMAIL}
© ${new Date().getFullYear()} Kapu-LK. All rights reserved.`;

  return { html, text, subject: `${code} is your Kapu-LK password reset code` };
}

/**
 * 4. 6-Day Inactivity Reminder Template
 */
function getInactivityReminderTemplate({ name, daysRemaining = 4, loginUrl = 'http://localhost:3000/login' }) {
  const safeName = escapeHtml(name || 'Member');
  const safeDays = escapeHtml(daysRemaining);
  const safeLoginUrl = escapeHtml(loginUrl);

  const html = wrapLayout({
    title: 'We Miss You on Kapu-LK — Keep Your Account Active',
    previewText: `Your Kapu-LK account has been inactive. Log in to keep your profile active.`,
    contentHtml: `
      <h2 class="greeting">Hello ${safeName},</h2>
      <p>We noticed you haven't visited <strong>Kapu-LK</strong> recently. We wanted to reach out and check in on your partner search!</p>

      <div style="background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <h4 style="margin: 0 0 8px 0; color: #b45309; font-size: 15px; font-weight: 700;">
          ⏳ Inactivity Notice: ${safeDays} Days Remaining
        </h4>
        <p style="margin: 0; font-size: 13.5px; color: #78350f; line-height: 1.6;">
          To protect community privacy and ensure that only active members appear in search results, accounts with no activity for <strong>10 consecutive days</strong> are automatically paused. You have <strong>${safeDays} days remaining</strong> before your account is deactivated.
        </p>
      </div>

      <p>Keeping your profile active is simple — simply log in or view matches today:</p>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${safeLoginUrl}" class="btn" target="_blank" rel="noopener noreferrer">
          Log In &amp; Keep Account Active &rarr;
        </a>
      </div>

      <p style="font-size: 13.5px; color: #64748b;">
        New members join Kapu-LK daily from Colombo, Kandy, Gampaha, and overseas. Don't miss out on genuine connection requests waiting for you.
      </p>
    `,
  });

  const text = `Hello ${name || 'Member'},

We noticed you haven't visited Kapu-LK in the last 6 days.

To protect member privacy, accounts with no activity for 10 consecutive days are automatically deactivated. You have ${daysRemaining} days remaining before your account is paused.

Simply log in to keep your profile active:
${loginUrl}

If you need any assistance, feel free to reply or contact ${SUPPORT_EMAIL}.

The Kapu-LK Support Team
© ${new Date().getFullYear()} Kapu-LK. All rights reserved.`;

  return { html, text, subject: 'Keep Your Kapu-LK Account Active — 4 Days Remaining' };
}

/**
 * 5. 10-Day Account Deactivated Template
 */
function getAccountDeactivatedTemplate({ name, reactivationUrl = 'http://localhost:3000/login' }) {
  const safeName = escapeHtml(name || 'Member');
  const safeReactivationUrl = escapeHtml(reactivationUrl);

  const html = wrapLayout({
    title: 'Your Kapu-LK Account Has Been Paused',
    previewText: `Your account has been deactivated due to 10 days of inactivity. Log in anytime to reactivate.`,
    contentHtml: `
      <h2 class="greeting">Hello ${safeName},</h2>
      <p>In accordance with our platform privacy policy, your <strong>Kapu-LK</strong> account has been temporarily <strong>deactivated</strong> after 10 consecutive days of inactivity.</p>

      <div style="background-color: #f1f5f9; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <h4 style="margin: 0 0 8px 0; color: #334155; font-size: 15px; font-weight: 700;">
          🔒 What does this mean?
        </h4>
        <ul style="margin: 0; padding-left: 18px; font-size: 13.5px; color: #475569; line-height: 1.6;">
          <li>Your profile is hidden from search and discovery to safeguard your privacy.</li>
          <li>Your messages, profile details, and account data remain completely intact.</li>
          <li>You can reactivate your account at any time simply by signing in.</li>
        </ul>
      </div>

      <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 24px;">How to Reactivate Your Account:</h3>
      <p>Whenever you are ready to resume your partner search, simply log in with your registered email and password. Your account will be restored instantly.</p>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${safeReactivationUrl}" class="btn" target="_blank" rel="noopener noreferrer">
          Log In to Reactivate &rarr;
        </a>
      </div>

      <p style="font-size: 13px; color: #64748b;">
        If you have questions or did not wish for your account to be paused, contact us anytime at <a href="mailto:${SUPPORT_EMAIL}" style="color: #7c3aed;">${SUPPORT_EMAIL}</a>.
      </p>
    `,
  });

  const text = `Hello ${name || 'Member'},

Your Kapu-LK account has been temporarily deactivated after 10 consecutive days of inactivity to protect your privacy.

Don't worry — your profile, photos, and messages are completely safe!

How to Reactivate:
Whenever you wish to resume your search, simply log in with your email and password at:
${reactivationUrl}

Your account will be instantly reactivated.

Contact Support: ${SUPPORT_EMAIL}
The Kapu-LK Support Team
© ${new Date().getFullYear()} Kapu-LK. All rights reserved.`;

  return { html, text, subject: 'Your Kapu-LK Account Has Been Paused (Reactivate Anytime)' };
}

module.exports = {
  SUPPORT_EMAIL,
  BRAND_NAME,
  escapeHtml,
  getEmailVerificationTemplate,
  getWelcomeEmailTemplate,
  getPasswordResetCodeTemplate,
  getInactivityReminderTemplate,
  getAccountDeactivatedTemplate,
};
