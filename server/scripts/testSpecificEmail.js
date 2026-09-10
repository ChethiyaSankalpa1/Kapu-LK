const { sendEmailVerificationCode } = require('../services/emailService');
const crypto = require('crypto');
require('dotenv').config();

async function testSpecificEmail() {
  console.log('=== Testing Email Delivery to kumudukumara752@gmail.com ===\n');
  
  // Generate a real verification code
  const testCode = crypto.randomInt(100000, 1000000).toString();
  console.log('Generated verification code:', testCode);
  console.log('Target email: kumudukumara752@gmail.com\n');
  
  try {
    console.log('Attempting to send email via Resend API...');
    const result = await sendEmailVerificationCode({
      to: 'kumudukumara752@gmail.com',
      name: 'Kumudu Kumara',
      code: testCode,
      expiresMinutes: 15,
    });
    
    console.log('Email Result:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n✅ Email sent successfully!');
      console.log('Message ID:', result.messageId);
      console.log('Mode:', result.mock ? 'MOCK (development)' : 'REAL (sent via email service)');
      console.log('\n📧 Please check your inbox AND spam folder for the verification code:', testCode);
      console.log('The email should arrive within 1-2 minutes.');
    } else {
      console.log('\n❌ Email failed to send');
      console.log('Error:', result.error);
      console.log('Error Code:', result.errorCode);
    }
  } catch (error) {
    console.error('Exception during email send:', error.message);
    console.error('Stack:', error.stack);
  }
}

testSpecificEmail().catch(console.error);