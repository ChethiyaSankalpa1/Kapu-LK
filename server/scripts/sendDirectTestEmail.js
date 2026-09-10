const { sendEmailVerificationCode } = require('../services/emailService');
const crypto = require('crypto');
require('dotenv').config();

async function sendDirectTestEmail() {
  console.log('=== Direct Email Test ===\n');
  
  // Generate a real verification code
  const testCode = crypto.randomInt(100000, 1000000).toString();
  console.log('Generated verification code:', testCode);
  console.log('Target email: chethiyasankalpa456@gmail.com\n');
  
  try {
    console.log('Attempting to send email...');
    const result = await sendEmailVerificationCode({
      to: 'chethiyasankalpa456@gmail.com',
      name: 'Chethiya Sankalpa',
      code: testCode,
      expiresMinutes: 15,
    });
    
    console.log('Email Result:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n✅ Email sent successfully!');
      console.log('Message ID:', result.messageId);
      console.log('Mode:', result.mock ? 'MOCK (development)' : 'REAL (sent via email service)');
      console.log('\nPlease check your inbox for the verification code:', testCode);
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

sendDirectTestEmail().catch(console.error);