const https = require('https');
const {
  SUPPORT_EMAIL,
  getEmailVerificationTemplate,
  getWelcomeEmailTemplate,
  getPasswordResetCodeTemplate,
  getInactivityReminderTemplate,
  getAccountDeactivatedTemplate,
} = require('./emailTemplates');

let lastDeliveryStatus = {
  timestamp: null,
  recipient: null,
  success: null,
  error: null,
  messageId: null,
};

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
 * Get sender name and address from environment variables
 */
function getSender() {
  const name = process.env.EMAIL_FROM_NAME || 'Kapu-LK Support Team';
  const email = process.env.EMAIL_FROM || process.env.EMAIL_FROM_ADDRESS || 'kapulk.support@gmail.com';
  return { name, email };
}

/**
 * Resolve client base URL for links in email templates
 */
function getClientUrl() {
  return process.env.CLIENT_URL || 'http://localhost:3000';
}

/**
 * Single reusable sendEmail service via Brevo Transactional Email REST API over HTTPS
 * POST https://api.brevo.com/v3/smtp/email
 * 
 * Render Free plan blocks outbound SMTP (ports 25, 465, 587).
 * This service uses pure HTTPS (port 443) which works 100% on Render Free.
 */
function sendEmail({ to, name, subject, html, text }) {
  return new Promise((resolve) => {
    if (!to) {
      console.warn('[EmailService] Skipped sendEmail: No recipient specified');
      return resolve({ success: false, error: 'Recipient address required' });
    }

    const apiKey = (process.env.BREVO_API_KEY || '').trim();

    // In development mode without Brevo API key, simulate dispatch safely without exposing secrets
    if (!apiKey) {
      console.log(`[EmailService Mock] Brevo API key not configured. Mocking email to ${maskEmail(to)} | Subject: "${subject}"`);
      const mockResult = { success: true, messageId: `mock-${Date.now()}`, mock: true };
      lastDeliveryStatus = {
        timestamp: new Date().toISOString(),
        recipient: maskEmail(to),
        success: true,
        error: null,
        messageId: mockResult.messageId,
      };
      return resolve(mockResult);
    }

    const sender = getSender();
    const recipientList = Array.isArray(to)
      ? to.map((r) => (typeof r === 'string' ? { email: r } : r))
      : [{ email: to, name: name || to }];

    const payload = JSON.stringify({
      sender,
      to: recipientList,
      subject,
      htmlContent: html,
      textContent: text || '',
      headers: {
        'X-Priority': '3',
        'X-Mailer': 'Kapu-LK Mailer',
        'X-Auto-Response-Suppress': 'All',
        'List-Unsubscribe': `<mailto:${SUPPORT_EMAIL}?subject=unsubscribe>`,
      },
    });

    const options = {
      hostname: 'api.brevo.com',
      port: 443,
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey,
        'Content-Length': Buffer.byteLength(payload),
      },
      timeout: 15000,
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        const statusCode = res.statusCode;
        try {
          const parsed = JSON.parse(body || '{}');
          if (statusCode >= 200 && statusCode < 300) {
            const messageId = parsed.messageId || 'brevo-success';
            console.log(`[EmailService] Brevo HTTP ${statusCode} | Email sent to ${maskEmail(to)} | MessageId: ${messageId}`);
            lastDeliveryStatus = {
              timestamp: new Date().toISOString(),
              recipient: maskEmail(to),
              success: true,
              error: null,
              messageId,
            };
            return resolve({ success: true, messageId });
          } else {
            const safeError = parsed.message || `Brevo HTTP error ${statusCode}`;
            console.error(`[EmailService] Brevo HTTP ${statusCode} delivery failed to ${maskEmail(to)}: ${safeError}`);
            lastDeliveryStatus = {
              timestamp: new Date().toISOString(),
              recipient: maskEmail(to),
              success: false,
              error: safeError,
              errorCode: statusCode,
              messageId: null,
            };
            return resolve({ success: false, error: safeError, statusCode });
          }
        } catch (parseErr) {
          const safeError = `Brevo returned HTTP ${statusCode} with unexpected format`;
          console.error(`[EmailService] ${safeError} to ${maskEmail(to)}`);
          lastDeliveryStatus = {
            timestamp: new Date().toISOString(),
            recipient: maskEmail(to),
            success: false,
            error: safeError,
            errorCode: statusCode,
            messageId: null,
          };
          return resolve({ success: false, error: safeError, statusCode });
        }
      });
    });

    req.on('error', (err) => {
      const safeError = `Network connection to Brevo API failed: ${err.message}`;
      console.error(`[EmailService] ${safeError}`);
      lastDeliveryStatus = {
        timestamp: new Date().toISOString(),
        recipient: maskEmail(to),
        success: false,
        error: safeError,
        errorCode: err.code || 'NETWORK_ERROR',
        messageId: null,
      };
      return resolve({ success: false, error: safeError });
    });

    req.on('timeout', () => {
      req.destroy();
      const timeoutError = 'Brevo HTTPS API request timed out after 15s';
      console.error(`[EmailService] ${timeoutError}`);
      lastDeliveryStatus = {
        timestamp: new Date().toISOString(),
        recipient: maskEmail(to),
        success: false,
        error: timeoutError,
        errorCode: 'TIMEOUT',
        messageId: null,
      };
      return resolve({ success: false, error: timeoutError });
    });

    req.write(payload);
    req.end();
  });
}

/**
 * 1. Send 6-Digit Email Verification Code (New user, previous user, or resend)
 */
async function sendEmailVerificationCode({ to, name, code, expiresMinutes = 10 }) {
  const template = getEmailVerificationTemplate({ name, code, expiresMinutes });
  return await sendEmail({
    to,
    name,
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
  return await sendEmail({
    to,
    name,
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
  return await sendEmail({
    to,
    name,
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
  return await sendEmail({
    to,
    name,
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
  return await sendEmail({
    to,
    name,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

/**
 * Backward compatibility: send password reset email by URL
 */
async function sendPasswordResetEmail({ to, resetUrl, name }) {
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
      <h2>Reset your Kapu LK password</h2>
      <p>Hello ${name || 'Member'},</p>
      <p>Click the link below to reset your password. The link expires in 10 minutes.</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>If you did not request this, you can ignore this email.</p>
      <p>Support: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
    </div>
  `;
  const text = `Hello ${name || 'Member'},\n\nUse this link to reset your password:\n${resetUrl}\n\nExpires in 10 minutes.\nIf you did not request this, ignore this email.\nSupport: ${SUPPORT_EMAIL}`;
  return await sendEmail({
    to,
    name,
    subject: 'Reset your Kapu LK password',
    html,
    text,
  });
}

/**
 * Verify Brevo HTTPS API connectivity over HTTPS port 443
 */
async function verifyConnection() {
  const apiKey = (process.env.BREVO_API_KEY || '').trim();
  if (!apiKey) {
    return {
      success: false,
      configured: false,
      provider: 'brevo',
      error: 'BREVO_API_KEY environment variable not configured',
    };
  }

  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: 'api.brevo.com',
        port: 443,
        path: '/v3/account',
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'api-key': apiKey,
        },
        timeout: 10000,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({
              success: true,
              configured: true,
              provider: 'brevo',
              message: 'Brevo HTTPS REST API verified successfully on port 443 (Render Free compatible)',
            });
          } else {
            resolve({
              success: false,
              configured: true,
              provider: 'brevo',
              statusCode: res.statusCode,
              error: `Brevo API returned status ${res.statusCode}`,
            });
          }
        });
      }
    );

    req.on('error', (err) => {
      resolve({
        success: false,
        configured: true,
        provider: 'brevo',
        error: `Brevo connection check error: ${err.message}`,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        configured: true,
        provider: 'brevo',
        error: 'Brevo connection check timed out after 10s',
      });
    });

    req.end();
  });
}

function getLastDeliveryStatus() {
  return lastDeliveryStatus;
}

function getCredentials() {
  return { emailUser: '', emailPass: '' };
}

module.exports = {
  sendEmail,
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
