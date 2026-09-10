const nodemailer = require('nodemailer');
require('dotenv').config();

async function advancedGmailDebug() {
  console.log('=== Advanced Gmail Authentication Debug ===\n');
  
  const emailUser = process.env.EMAIL_USER || process.env.SMTP_USER || '';
  const emailPass = process.env.EMAIL_APP_PASSWORD || process.env.EMAIL_PASS || process.env.SMTP_PASS || '';
  
  console.log('Current Configuration:');
  console.log(`EMAIL_USER: ${emailUser}`);
  console.log(`EMAIL_APP_PASSWORD: ${emailPass}`);
  console.log(`Password length: ${emailPass.length} characters`);
  console.log(`Password format: ${emailPass.includes(' ') ? 'Includes spaces' : 'No spaces'}\n`);
  
  // Try removing spaces from password (sometimes Google generates without spaces)
  console.log('Test 1: Try password without spaces...');
  try {
    const passNoSpaces = emailPass.replace(/\s/g, '');
    console.log(`Testing with password: ${passNoSpaces}`);
    
    const transporter1 = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: emailUser,
        pass: passNoSpaces,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
    
    await transporter1.verify();
    console.log('✅ Test 1 PASSED (password without spaces)\n');
    console.log('Please update .env to use password without spaces');
    return;
  } catch (error) {
    console.log('❌ Test 1 FAILED:', error.message, '\n');
  }
  
  // Try with exact password as provided
  console.log('Test 2: Try exact password with spaces...');
  try {
    const transporter2 = nodemailer.createTransport({
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
    });
    
    await transporter2.verify();
    console.log('✅ Test 2 PASSED (password with spaces)\n');
  } catch (error) {
    console.log('❌ Test 2 FAILED:', error.message, '\n');
  }
  
  // Try OAuth2 simulation (check if account needs web sign-in)
  console.log('Test 3: Check if account needs web browser sign-in...');
  console.log('The error "Please log in with your web browser" suggests:');
  console.log('1. The account needs to be accessed via web browser from this IP/location');
  console.log('2. There may be a security alert on the account');
  console.log('3. The App Password may have been revoked\n');
  
  console.log('=== Additional Troubleshooting Steps ===');
  console.log('1. Sign in to https://gmail.com with kapulk.support@gmail.com');
  console.log('2. Check for any security alerts or unusual activity warnings');
  console.log('3. Go to https://myaccount.google.com/security');
  console.log('4. Check "Recent security activity" - approve any pending sign-ins');
  console.log('5. Try generating the App Password again after web sign-in');
  console.log('6. Make sure 2-Step Verification is definitely enabled\n');
  
  console.log('=== Alternative Solutions ===');
  console.log('If Gmail continues to fail, consider:');
  console.log('- Resend API: https://resend.com (free tier, easy setup)');
  console.log('- Brevo API: https://www.brevo.com (free tier available)');
  console.log('- SendGrid: https://sendgrid.com (free tier available)');
}

advancedGmailDebug().catch(console.error);