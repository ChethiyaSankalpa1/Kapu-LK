const nodemailer = require('nodemailer');

let transporterPromise;

const buildTransporter = async () => {
  if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
    });
  }

  throw new Error('SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and SMTP_FROM.');
};

const getTransporter = async () => {
  if (!transporterPromise) {
    transporterPromise = buildTransporter();
  }
  return transporterPromise;
};

exports.sendPasswordResetEmail = async ({ to, resetUrl, name }) => {
  const transporter = await getTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  if (!from) {
    throw new Error('SMTP_FROM is not configured.');
  }

  await transporter.sendMail({
    from,
    to,
    subject: 'Reset your Kapu LK password',
    text: `Hello ${name || ''},\n\nUse this link to reset your password:\n${resetUrl}\n\nThis link expires in 1 hour.\nIf you did not request this, you can ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
        <h2>Reset your Kapu LK password</h2>
        <p>Hello ${name || 'there'},</p>
        <p>Click the link below to reset your password. The link expires in 1 hour.</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `,
  });
};
