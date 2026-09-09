/**
 * Automated Security Suite for Kapu-LK Matrimonial Application
 * Validates OWASP Top 10 defenses, IDOR, Lockout, Token Rotation, 2FA,
 * Magic Bytes, Price Tampering, Concurrency, and PII Masking.
 */
const http = require('http');
const { validateFileBuffer } = require('../utils/fileSignature');
const totp = require('../utils/totp');

const BASE_URL = 'http://localhost:5000';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const postData = options.body ? JSON.stringify(options.body) : null;

    const reqOptions = {
      method: options.method || 'GET',
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    if (postData) {
      reqOptions.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json,
        });
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('🚀 RUNNING COMPREHENSIVE SECURITY VERIFICATION SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, extraInfo = '') {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} - ${extraInfo}`);
      failed++;
    }
  }

  try {
    // 1. Health & Server Check
    const health = await request('/health');
    assert(health.status === 200, 'Server health check returns 200 OK');

    // 2. Admin Bootstrapping Protection Check
    const adminAttempt = await request('/api/admin/create-admin', {
      method: 'POST',
      body: { email: 'hacker@test.com', password: 'hacked' }
    });
    assert(adminAttempt.status === 403, 'Unauthenticated Admin Creation blocked (403 Forbidden)', `Got ${adminAttempt.status}`);

    // 3. Magic Bytes File Signature Validator
    const svgBuffer = Buffer.from('<svg onload=alert(1)>');
    const svgResult = validateFileBuffer(svgBuffer);
    assert(svgResult.valid === false, 'Magic bytes rejects SVG / script payload');

    const fakeJpgBuffer = Buffer.from('GIF89a this is not a jpeg');
    const fakeResult = validateFileBuffer(fakeJpgBuffer, ['image/jpeg']);
    assert(fakeResult.valid === false, 'Magic bytes rejects disguised non-JPEG format');

    const validJpgBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
    const validResult = validateFileBuffer(validJpgBuffer, ['image/jpeg']);
    assert(validResult.valid === true, 'Magic bytes accepts valid JPEG header');

    // 4. TOTP 2FA Verification Engine
    const secret = totp.generateSecret();
    const currentCode = totp.generateTOTP(secret);
    const isTotpValid = totp.verifyTOTP(currentCode, secret);
    assert(isTotpValid === true, 'RFC 6238 TOTP generates and verifies authentic codes');

    const isBadCodeRejected = !totp.verifyTOTP('000000', secret);
    assert(isBadCodeRejected === true, 'RFC 6238 TOTP rejects invalid 6-digit tokens');

    // 5. Normal User Registration
    const testEmail = `sec_${Date.now()}@example.com`;
    const testPassword = 'Password@123';
    const regRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Security Test User',
        email: testEmail,
        password: testPassword,
        gender: 'male',
        agreedToTerms: true,
      }
    });
    assert(regRes.status === 201 && regRes.data.token, 'User registration succeeds with JWT token');
    const token = regRes.data.token;
    const refreshToken = regRes.data.refreshToken;
    const userId = regRes.data._id;

    // 6. Refresh Token Rotation
    const refreshRes = await request('/api/auth/refresh', {
      method: 'POST',
      body: { refreshToken }
    });
    assert(refreshRes.status === 200 && refreshRes.data.token, 'Refresh token rotation succeeds and issues new access token');
    const newRefreshToken = refreshRes.data.refreshToken;

    // 7. Refresh Token Reuse Detection
    const reuseRes = await request('/api/auth/refresh', {
      method: 'POST',
      body: { refreshToken } // old used token
    });
    assert(reuseRes.status === 403, 'Reused refresh token is detected and rejected with 403 Forbidden');

    // 8. Account Lockout on Brute Force
    const bruteEmail = `lockout_${Date.now()}@example.com`;
    await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Lockout Target',
        email: bruteEmail,
        password: 'CorrectPassword123',
        gender: 'female',
        agreedToTerms: true,
      }
    });

    let lockedStatus = null;
    for (let i = 1; i <= 6; i++) {
      const failRes = await request('/api/auth/login', {
        method: 'POST',
        body: { email: bruteEmail, password: 'WrongPassword' }
      });
      if (failRes.status === 423) {
        lockedStatus = 423;
        break;
      }
    }
    assert(lockedStatus === 423, '5 failed attempts trigger 423 Account Locked status');

    // 9. Payment Slips Access Control (Confidentiality check)
    const slipRes = await request('/uploads/payment-slips/secret-slip.jpg');
    assert(slipRes.status === 401 || slipRes.status === 403, 'Direct access to payment slips without auth blocked (401/403)');

    // 10. Message Reaction IDOR Check
    // Authenticate admin
    const adminLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@matrimony.com', password: 'admin123' }
    });
    const adminToken = adminLogin.data.token;

    // Admin sends message to user
    const msgRes = await request('/api/messages', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { to: userId, content: 'Confidential message' }
    });
    const messageId = msgRes.data._id;

    // Register 3rd party outsider
    const outsiderReg = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Outsider',
        email: `outsider_${Date.now()}@example.com`,
        password: 'Password@123',
        gender: 'other',
        agreedToTerms: true,
      }
    });
    const outsiderToken = outsiderReg.data.token;

    // Outsider tries to react to admin-user message (IDOR attack)
    const idorReaction = await request(`/api/messages/${messageId}/reaction`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${outsiderToken}` },
      body: { emoji: '❤️' }
    });
    assert(idorReaction.status === 403, 'Non-participant reaction rejected with 403 Forbidden (IDOR prevented)');

    // 11. Point Redemption Price Tampering Defense
    const freshLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: testEmail, password: testPassword }
    });
    const freshToken = freshLogin.data.token;

    const tamperRedeem = await request('/api/redemption/redeem', {
      method: 'POST',
      headers: { Authorization: `Bearer ${freshToken}` },
      body: {
        rewardType: 'wallet',
        rewardName: 'Rs. 500 Wallet Cash',
        pointsCost: 1, // Attacker tamper attempt!
      }
    });
    assert(tamperRedeem.status === 400 && String(tamperRedeem.data.message).includes('Insufficient points'),
      'Point redemption tampering prevented: client pointsCost ignored, true cost enforced');

    // 12. PII Contact Masking Check
    const piiCheck = await request(`/api/users/${userId}`, {
      headers: { Authorization: `Bearer ${outsiderToken}` },
    });
    assert(piiCheck.data.email === undefined && piiCheck.data.phoneNumber === undefined,
      'PII Protected: Third-party viewer cannot see email or phone number in profile details');

  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
