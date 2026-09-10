const nodemailer = require('nodemailer');
const {
  SUPPORT_EMAIL,
  getEmailVerificationTemplate,
  getWelcomeEmailTemplate,
  getPasswordResetCodeTemplate,
  getInactivityReminderTemplate,
  getAccountDeactivatedTemplate,
} = require('./emailTemplates');

let transporterInstance = null;

/**
 * Mask an email address for safe logging without exposing PII:
 * e.g. "john.doe@gmail.com" -> "j***e@gmail.com"
 */
function maskEmail(email) {
  if (!email || typeof email !== 'string') return '[empty-email]';
  const parts = email.split('@');
  if (parts.length !== 2) return '[invalid-email]';
  const name = parts[0];
  const domain = parts[1];
  if (name.length <= 2) {
    return `${name[0]}*@${domain}`;
  }
  return `${name[0]}***${name[name.length - 1]}@${domain}`;
}

/**
 * Build or retrieve the nodemailer transporter singleton
 */
function getTransporter() {
  if (transporterInstance) {
    return transporterInstance;
  }

  const emailUser = process.env.EMAIL_USER || process.env.SMTP_USER;
  const emailPass = (process.env.EMAIL_APP_PASSWORD || process.env.SMTP_PASS || '').replace(/\s+/g, '');

  if (process.env.EMAIL_APP_PASSWORD && emailUser) {
    // Gmail App Password transport
    transporterInstance = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });
  } else if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
    // Standard custom SMTP transport
    transporterInstance = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
      auth: emailUser
        ? {
            user: emailUser,
            pass: emailPass,
          }
        : undefined,
    });
  } else {
    // Mock / fallback logger transport in local environments without SMTP configured
    console.warn('[EmailService] SMTP credentials not set. Emails will be logged safely in development mode.');
    transporterInstance = {
      sendMail: async (mailOptions) => {
        console.log(`[EmailService Mock] Outgoing mail to ${maskEmail(mailOptions.to)} | Subject: "${mailOptions.subject}"`);
        return { messageId: `mock-${Date.now()}` };
      },
      verify: async () => true,
    };
  }

  return transporterInstance;
}

/**
 * Resolve the standard "From" header
 */
function getFromHeader() {
  const fromName = process.env.EMAIL_FROM_NAME || 'Kapu-LK Support Team';
  const fromAddress = process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER || SUPPORT_EMAIL;
  return `"${fromName}" <${fromAddress}>`;
}

/**
 * Resolve client base URL for links in email templates
 */
function getClientUrl() {
  return process.env.CLIENT_URL || 'http://localhost:3000';
}

/**
 * Base internal send method with safe error handling and logging
 */
async function dispatchEmail({ to, subject, html, text }) {
  try {
    if (!to) {
      console.warn('[EmailService] Skipped dispatch: no recipient specified');
      return { success: false, error: 'Recipient address required' };
    }

    const transporter = getTransporter();
    const from = getFromHeader();

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });

    console.log(`[EmailService] Mail sent to ${maskEmail(to)} | MessageId: ${info.messageId || 'ok'}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    // Log failure safely without printing passwords, tokens, or raw credentials
    console.error(`[EmailService] Delivery failed to ${maskEmail(to)}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * 1. Send 6-Digit Email Verification Code (New registration or existing unverified login)
 */
async function sendEmailVerificationCode({ to, name, code, expiresMinutes = 15 }) {
  const template = getEmailVerificationTemplate({ name, code, expiresMinutes });
  return await dispatchEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

/**
 * 2. Send Welcome Email (Sent once after verification + complete profile setup)
 */
async function sendWelcomeEmail({ to, name, loginUrl }) {
  const targetUrl = loginUrl || `${getClientUrl()}/login`;
  const template = getWelcomeEmailTemplate({ name, loginUrl: targetUrl });
  return await dispatchEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

/**
 * 3. Send Password Reset 6-Digit Code
 */
async function sendPasswordResetCode({ to, name, code, expiresMinutes = 10 }) {
  const template = getPasswordResetCodeTemplate({ name, code, expiresMinutes });
  return await dispatchEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

/**
 * 4. Send 6-Day Inactivity Reminder Email (4 Days Remaining)
 */
async function sendInactivityReminderEmail({ to, name, daysRemaining = 4, loginUrl }) {
  const targetUrl = loginUrl || `${getClientUrl()}/login`;
  const template = getInactivityReminderTemplate({ name, daysRemaining, loginUrl: targetUrl });
  return await dispatchEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

/**
 * 5. Send Account Deactivated Email (10 Days Inactive)
 */
async function sendAccountDeactivatedEmail({ to, name, reactivationUrl }) {
  const targetUrl = reactivationUrl || `${getClientUrl()}/login`;
  const template = getAccountDeactivatedTemplate({ name, reactivationUrl: targetUrl });
  return await dispatchEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

/**
 * Backward compatibility: send password reset email by URL (if any old call remains)
 */
async function sendPasswordResetEmail({ to, resetUrl, name }) {
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
      <h2>Reset your Kapu LK password</h2>
      <p>Hello ${name || 'Member'},</p>
      <p>Click the link below to reset your password. The link expires in 15 minutes.</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>If you did not request this, you can ignore this email.</p>
      <p>Support: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
    </div>
  `;
  const text = `Hello ${name || 'Member'},\n\nUse this link to reset your password:\n${resetUrl}\n\nExpires in 15 minutes.\nIf you did not request this, ignore this email.\nSupport: ${SUPPORT_EMAIL}`;
  return await dispatchEmail({
    to,
    subject: 'Reset your Kapu LK password',
    html,
    text,
  });
}

/**
 * Verify transporter SMTP connectivity
 */
async function verifyConnection() {
  try {
    const transporter = getTransporter();
    if (transporter.verify) {
      await transporter.verify();
      return { success: true, message: 'SMTP connection verified successfully' };
    }
    return { success: true, message: 'Mock transport active' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = {
  maskEmail,
  sendEmailVerificationCode,
  sendWelcomeEmail,
  sendPasswordResetCode,
  sendInactivityReminderEmail,
  sendAccountDeactivatedEmail,
  sendPasswordResetEmail,
  verifyConnection,
};
