const nodemailer = require('nodemailer');
require('dotenv').config();

async function debugGmailAuth() {
  console.log('=== Gmail Authentication Debug ===\n');
  
  const emailUser = process.env.EMAIL_USER || process.env.SMTP_USER || '';
  const emailPass = process.env.EMAIL_APP_PASSWORD || process.env.EMAIL_PASS || process.env.SMTP_PASS || '';
  
  console.log('Configuration Check:');
  console.log(`EMAIL_USER: ${emailUser ? emailUser : 'NOT SET'}`);
  console.log(`EMAIL_APP_PASSWORD: ${emailPass ? '*** SET ***' : 'NOT SET'}`);
  console.log(`EMAIL_FROM_ADDRESS: ${process.env.EMAIL_FROM_ADDRESS || 'NOT SET'}\n`);
  
  if (!emailUser || !emailPass) {
    console.error('❌ Gmail credentials are not configured in .env file');
    return;
  }
  
  // Test 1: Basic connection without TLS
  console.log('Test 1: Basic Gmail SMTP connection (port 465, SSL)...');
  try {
    const transporter1 = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
      debug: true,
      logger: true,
    });
    
    await transporter1.verify();
    console.log('✅ Test 1 PASSED\n');
  } catch (error) {
    console.log('❌ Test 1 FAILED:', error.message);
    console.log('Error code:', error.code);
    console.log('Error response:', error.response || 'No response\n');
  }
  
  // Test 2: TLS connection (port 587)
  console.log('Test 2: Gmail SMTP with STARTTLS (port 587)...');
  try {
    const transporter2 = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
      debug: true,
      logger: true,
    });
    
    await transporter2.verify();
    console.log('✅ Test 2 PASSED\n');
  } catch (error) {
    console.log('❌ Test 2 FAILED:', error.message);
    console.log('Error code:', error.code);
    console.log('Error response:', error.response || 'No response\n');
  }
  
  // Test 3: Try OAuth2 (if you have OAuth credentials)
  console.log('Test 3: Test with less secure app settings check...');
  console.log('Note: Google has disabled "Less Secure Apps" - you must use App Passwords\n');
  
  console.log('=== Common Gmail Authentication Issues ===');
  console.log('1. 2-Step Verification must be ENABLED on the Google account');
  console.log('2. App Password must be generated from: https://myaccount.google.com/apppasswords');
  console.log('3. App Password is 16 characters (spaces are part of the password)');
  console.log('4. Sometimes you need to sign in to the account via web browser first');
  console.log('5. Google may block connections from new IPs/locations temporarily');
  console.log('6. Check if the account has any security alerts\n');
  
  console.log('=== Recommended Actions ===');
  console.log('1. Go to https://myaccount.google.com/security');
  console.log('2. Ensure 2-Step Verification is enabled');
  console.log('3. Generate a NEW App Password');
  console.log('4. Use the exact 16-character password (including spaces)');
  console.log('5. If still failing, try Resend API as alternative\n');
}

debugGmailAuth().catch(console.error);