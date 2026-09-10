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
let lastDeliveryStatus = {
  timestamp: null,
  recipient: null,
  success: null,
  error: null,
  messageId: null,
};

function getCredentials() {
  const rawUser = process.env.EMAIL_USER || process.env.SMTP_USER || '';
  const emailUser = rawUser.trim().replace(/['"]+/g, '');
  const rawPass = process.env.EMAIL_APP_PASSWORD || process.env.EMAIL_PASS || process.env.SMTP_PASS || '';
  const emailPass = rawPass.trim().replace(/['"]+/g, '').replace(/\s+/g, '');
  return { emailUser, emailPass };
}

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
  const { emailUser, emailPass } = getCredentials();

  if (transporterInstance) {
    return transporterInstance;
  }

  if (emailUser && emailPass) {
    // Gmail App Password transport with IPv4 enforcement and strict timeouts
    transporterInstance = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
      tls: {
        rejectUnauthorized: true,
      },
      family: 4, // Force IPv4 to prevent hanging on cloud servers without IPv6 routing
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 12000,
    });
  } else if ((process.env.SMTP_HOST || process.env.EMAIL_HOST) && (process.env.SMTP_PORT || process.env.EMAIL_PORT)) {
    // Standard custom SMTP transport
    const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
    const port = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT);
    transporterInstance = nodemailer.createTransport({
      host,
      port,
      secure: port === 465 || String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
      auth: emailUser
        ? {
            user: emailUser,
            pass: emailPass,
          }
        : undefined,
      family: 4,
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 12000,
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

    // Check if using mock transport (no SMTP credentials)
    const { emailUser, emailPass } = getCredentials();
    if (!emailUser || !emailPass) {
      console.log(`[EmailService Mock] Outgoing mail to ${maskEmail(to)} | Subject: "${subject}"`);
      console.log(`[EmailService Mock] SMTP credentials not configured. EMAIL_USER and EMAIL_APP_PASSWORD/EMAIL_PASS must be set in environment variables`);
      console.log(`[EmailService Mock] Email not actually sent - this is development mode only`);
      return { success: true, messageId: `mock-${Date.now()}`, mock: true };
    }

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Primary email dispatch timed out after 10s')), 10000)
    );

    let info;
    try {
      info = await Promise.race([
        transporter.sendMail({
          from,
          to,
          subject,
          text,
          html,
        }),
        timeoutPromise,
      ]);
    } catch (primaryErr) {
      // If primary port 465 timed out or failed, attempt fallback on port 587
      if (emailUser.includes('gmail.com') || (process.env.EMAIL_HOST && process.env.EMAIL_HOST.includes('gmail'))) {
        console.warn(`[EmailService] Primary transport failed (${primaryErr.message}), trying port 587 fallback...`);
        const fallbackTransporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          requireTLS: true,
          auth: { user: emailUser, pass: emailPass },
          family: 4,
          connectionTimeout: 6000,
          greetingTimeout: 6000,
          socketTimeout: 8000,
        });
        const fallbackTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Fallback email dispatch timed out after 8s')), 8000)
        );
        info = await Promise.race([
          fallbackTransporter.sendMail({ from, to, subject, text, html }),
          fallbackTimeout,
        ]);
        transporterInstance = fallbackTransporter;
      } else {
        throw primaryErr;
      }
    }

    console.log(`[EmailService] Mail sent to ${maskEmail(to)} | MessageId: ${info.messageId || 'ok'}`);
    lastDeliveryStatus = {
      timestamp: new Date().toISOString(),
      recipient: maskEmail(to),
      success: true,
      error: null,
      messageId: info.messageId || 'ok',
    };
    return { success: true, messageId: info.messageId };
  } catch (err) {
    // Log failure safely without printing passwords, tokens, or raw credentials
    console.error(`[EmailService] Delivery failed to ${maskEmail(to)}:`, err.message);
    console.error(`[EmailService] Error code: ${err.code || 'UNKNOWN'}`);
    console.error(`[EmailService] Check your SMTP credentials in environment variables`);
    
    lastDeliveryStatus = {
      timestamp: new Date().toISOString(),
      recipient: maskEmail(to),
      success: false,
      error: err.message,
      errorCode: err.code || 'UNKNOWN',
      messageId: null,
    };
    return { success: false, error: err.message, errorCode: err.code || 'UNKNOWN' };
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
  const { emailUser, emailPass } = getCredentials();
  if (!emailUser || !emailPass) {
    return { success: false, configured: false, error: 'Credentials not configured' };
  }
  try {
    const transporter = getTransporter();
    if (transporter && transporter.verify) {
      const verifyPromise = transporter.verify();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Primary SMTP verify timed out after 6 seconds')), 6000)
      );
      await Promise.race([verifyPromise, timeoutPromise]);
      return { success: true, configured: true, message: 'SMTP connection verified successfully on port 465' };
    }
    return { success: true, configured: false, message: 'Mock transport active' };
  } catch (err) {
    // Try fallback on port 587 if port 465 failed
    if (emailUser.includes('gmail.com')) {
      try {
        const fallbackTransporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          requireTLS: true,
          auth: { user: emailUser, pass: emailPass },
          family: 4,
          connectionTimeout: 5000,
          greetingTimeout: 5000,
          socketTimeout: 5000,
        });
        const fbTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Fallback SMTP verify timed out after 5 seconds')), 5000)
        );
        await Promise.race([fallbackTransporter.verify(), fbTimeout]);
        transporterInstance = fallbackTransporter;
        return {
          success: true,
          configured: true,
          message: 'SMTP connection verified successfully on port 587 fallback',
        };
      } catch (fbErr) {
        return {
          success: false,
          configured: true,
          error: `Primary (465) failed: ${err.message}. Fallback (587) failed: ${fbErr.message}`,
          code: fbErr.code || err.code || 'UNKNOWN',
        };
      }
    }

    return {
      success: false,
      configured: true,
      error: err.message,
      code: err.code || 'UNKNOWN',
      response: err.response || null,
    };
  }
}

function getLastDeliveryStatus() {
  return lastDeliveryStatus;
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
  getLastDeliveryStatus,
  getCredentials,
};
