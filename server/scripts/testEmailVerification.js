require('dotenv').config();
const crypto = require('crypto');
const { sendEmailVerificationCode, verifyConnection, getLastDeliveryStatus } = require('../services/emailService');

async function testEmailVerification() {
  console.log('=== Email Verification Test ===\n');
  
  // 1. Test SMTP connection
  console.log('1. Testing SMTP connection...');
  const connectionTest = await verifyConnection();
  console.log('Connection Test Result:', JSON.stringify(connectionTest, null, 2));
  
  if (!connectionTest.success) {
    console.error('❌ SMTP connection failed. Email delivery will not work.');
    console.error('Error:', connectionTest.error);
    return;
  }
  
  console.log('✅ SMTP connection successful\n');
  
  // 2. Generate test verification code
  const testCode = crypto.randomInt(100000, 1000000).toString();
  console.log('2. Generated test verification code:', testCode);
  
  // 3. Send test email
  console.log('3. Sending test email to chethiyasankalpa456@gmail.com...');
  const emailResult = await sendEmailVerificationCode({
    to: 'chethiyasankalpa456@gmail.com',
    name: 'Test User',
    code: testCode,
    expiresMinutes: 15,
  });
  
  console.log('Email Result:', JSON.stringify(emailResult, null, 2));
  
  // 4. Check delivery status
  const deliveryStatus = getLastDeliveryStatus();
  console.log('4. Last Delivery Status:', JSON.stringify(deliveryStatus, null, 2));
  
  if (emailResult.success) {
    console.log('\n✅ Test email sent successfully!');
    console.log('Message ID:', emailResult.messageId);
    console.log('Please check your inbox (and spam folder) for the verification code:', testCode);
  } else {
    console.error('\n❌ Test email failed to send');
    console.error('Error:', emailResult.error);
  }
}

// Run the test
testEmailVerification().catch(console.error);
