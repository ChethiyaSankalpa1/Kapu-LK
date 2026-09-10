const https = require('https');

const uniqueSuffix = Date.now();
const randomPhone = '07' + String(Math.floor(10000000 + Math.random() * 90000000));
const data = JSON.stringify({
  name: 'Chethiya Test',
  username: `user_${uniqueSuffix}`,
  email: `test_${uniqueSuffix}@gmail.com`,
  password: 'DemoPassword123!',
  phoneNumber: randomPhone,
  birthDate: '2000-01-01',
  gender: 'male',
  age: 26,
  language: 'en',
  is18OrOlder: true,
  isAccurateInfo: true,
  acceptedTermsAndPrivacy: true,
  acceptedInactivityDeletion: true,
  agreedToTerms: true,
  policyVersions: {
    privacyPolicy: '2.0',
    termsOfService: '2.0',
    communityGuidelines: '1.0',
  },
});

const options = {
  hostname: 'kapu-lk-2.onrender.com',
  port: 443,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  },
};

console.log('Sending live registration request to Render...');
const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => {
    console.log(`HTTP Status: ${res.statusCode}`);
    console.log('Response Headers:', res.headers);
    console.log('Response Body:', body);
  });
});

req.on('error', (e) => {
  console.error('Request Error:', e.message);
});

req.write(data);
req.end();
