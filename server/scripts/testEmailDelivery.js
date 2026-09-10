/**
 * Kapu-LK Live SMTP Handshake and Delivery Test Script
 *
 * Verifies that the configured Gmail credentials can authenticate
 * and establish an encrypted TLS SMTP connection.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const nodemailer = require('nodemailer');

async function testSmtpConnection() {
  console.log('\n======================================================');
  console.log('📧 KAPU-LK GMAIL SMTP LIVE VERIFICATION');
  console.log('======================================================\n');

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_APP_PASSWORD;
  const fromName = process.env.EMAIL_FROM_NAME || 'Kapu-LK Support Team';

  console.log(`Connecting as: ${user}`);
  console.log(`From Name:     ${fromName}`);
  console.log(`Password set:  ${Boolean(pass)} (${pass ? pass.replace(/./g, '*') : 'NOT SET'})\n`);

  if (!user || !pass) {
    console.error('❌ Missing EMAIL_USER or EMAIL_APP_PASSWORD in server/.env');
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: user.trim(),
      pass: pass.trim(),
    },
    tls: {
      rejectUnauthorized: true,
    },
  });

  try {
    console.log('Verifying SMTP connection credentials with Gmail...');
    const verification = await transporter.verify();
    console.log('✅ SMTP Connection Handshake Successful! Transporter is ready to deliver emails.');

    // Test sending an actual test verification ping to the support address
    const testRecipient = process.env.TEST_EMAIL_RECIPIENT || user;
    console.log(`\nDispatching live test email to: ${testRecipient}...`);

    const info = await transporter.sendMail({
      from: `"${fromName}" <${user}>`,
      to: testRecipient,
      subject: 'Kapu-LK SMTP Verification Check',
      text: 'This is an automated verification email confirming that Kapu-LK SMTP service is fully operational.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px; max-width: 500px;">
          <h2 style="color: #7C3AED; margin-top: 0;">Kapu-LK Email Service Verified</h2>
          <p>This automated check confirms that your Gmail App Password and SMTP connection are configured correctly.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 15px 0;" />
          <p style="font-size: 12px; color: #64748b;">Sender: ${user} | Timestamp: ${new Date().toISOString()}</p>
        </div>
      `,
    });

    console.log('✅ Live Email Sent Successfully!');
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Response:   ${info.response}\n`);
    console.log('======================================================');
    console.log('🎉 SMTP CONFIGURATION 100% OPERATIONAL');
    console.log('======================================================\n');
  } catch (error) {
    console.error('❌ SMTP Connection / Delivery Failed:');
    console.error(`   Code:    ${error.code}`);
    console.error(`   Message: ${error.message}`);
    if (error.response) console.error(`   Server Response: ${error.response}`);
    process.exit(1);
  }
}

testSmtpConnection();
