const { sendEmailVerificationCode } = require('../services/emailService');
require('dotenv').config();

async function sendTestEmail() {
  try {
    console.log('📧 Sending test email to soulmatefind60@gmail.com...\n');
    
    const result = await sendEmailVerificationCode({
      to: 'soulmatefind60@gmail.com',
      name: 'Test User',
      code: '123456',
      expiresMinutes: 15,
    });

    if (result.success) {
      console.log('✅ Test email sent successfully!');
      console.log(`   Message ID: ${result.messageId}`);
      console.log(`   Mock mode: ${result.mock ? 'Yes (development mode)' : 'No (real email sent)'}`);
      
      if (result.mock) {
        console.log('\n⚠️  Email was sent in MOCK mode (development)');
        console.log('   This means SMTP credentials are not properly configured.');
        console.log('   To send real emails, set EMAIL_USER and EMAIL_APP_PASSWORD in your .env file');
      } else {
        console.log('\n✅ Real email sent! Check your inbox at soulmatefind60@gmail.com');
      }
    } else {
      console.log('❌ Failed to send test email');
      console.log(`   Error: ${result.error}`);
      console.log(`   Error Code: ${result.errorCode || 'UNKNOWN'}`);
    }
  } catch (error) {
    console.error('❌ Error sending test email:', error.message);
  }
}

sendTestEmail();