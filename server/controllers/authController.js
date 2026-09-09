const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const PrivacyConsent = require('../models/PrivacyConsent');
const RefreshToken = require('../models/RefreshToken');
const Notification = require('../models/Notification');
const { Referral, ReferralCode } = require('../models/Referral');
const { UserStats } = require('../models/Achievement');
const cloudinary = require('../config/cloudinary');
const { sendPasswordResetEmail } = require('../utils/mailer');
const { logAuditEvent } = require('../middleware/auditLogger');
const {
  generateSecret,
  verifyTOTP,
  getOTPAuthURI,
  generateRecoveryCodes,
} = require('../utils/totp');

// Helpers for token generation
const getJwtSecret = () => process.env.JWT_SECRET || 'dev_jwt_secret_change_me';

const generateAccessToken = (user, is2FAAuthenticated = false) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      tokenVersion: user.tokenVersion || 0,
      is2FAAuthenticated,
    },
    getJwtSecret(),
    { expiresIn: '15m' } // 15-minute short-lived access token
  );
};

// Generate and store cryptographically secure refresh token
const createRefreshToken = async (user, req) => {
  const rawToken = crypto.randomBytes(40).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const ipAddress = req.headers['x-forwarded-for']
    ? req.headers['x-forwarded-for'].split(',')[0].trim()
    : req.ip || req.socket.remoteAddress || '';
  const userAgent = req.headers['user-agent'] || '';

  await RefreshToken.create({
    user: user._id,
    tokenHash,
    expiresAt,
    ipAddress: String(ipAddress).slice(0, 45),
    userAgent: String(userAgent).slice(0, 250),
  });

  return rawToken;
};

// Set HttpOnly, SameSite, Secure cookies
const setTokenCookies = (res, accessToken, refreshToken) => {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
  };

  if (accessToken) {
    res.cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
  }

  if (refreshToken) {
    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/auth',
    });
  }
};

const clearTokenCookies = (res) => {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
  };
  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', { ...cookieOptions, path: '/api/auth' });
};

const isValidPhoneNumber = (value) => !value || /^[0-9]+$/.test(value);

const getClientBaseUrl = () => {
  return process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { 
      name, 
      username, 
      email, 
      password, 
      phoneNumber, 
      age, 
      birthDate,
      gender, 
      interests,
      hobbies,
      agreedToTerms,
      is18OrOlder,
      isAccurateInfo,
      acceptedTermsAndPrivacy,
      acceptedInactivityDeletion,
      consentAgreements,
      policyVersions,
      language,
      referralCode,
    } = req.body;

    if (!isValidPhoneNumber(phoneNumber)) {
      return res.status(400).json({ message: 'Phone number must contain only numbers' });
    }

    // Age & BirthDate Validation (Strictly 18+)
    let computedAge = null;
    let parsedBirthDate = null;

    if (birthDate) {
      parsedBirthDate = new Date(birthDate);
      if (isNaN(parsedBirthDate.getTime())) {
        return res.status(400).json({ message: 'Invalid birth date provided' });
      }
      if (parsedBirthDate > new Date()) {
        return res.status(400).json({ message: 'Birth date cannot be in the future' });
      }
      const ageDiffMs = Date.now() - parsedBirthDate.getTime();
      const calculatedYears = Math.floor(ageDiffMs / (365.25 * 24 * 60 * 60 * 1000));
      if (calculatedYears < 18) {
        return res.status(400).json({ message: 'You must be at least 18 years of age to register on Kapu-LK' });
      }
      if (calculatedYears > 100) {
        return res.status(400).json({ message: 'Please enter a valid birth date' });
      }
      computedAge = calculatedYears;
    }

    if (age !== undefined && age !== null && age !== '') {
      const numericAge = Number(age);
      if (isNaN(numericAge) || numericAge < 18) {
        return res.status(400).json({ message: 'You must be at least 18 years of age to register on Kapu-LK' });
      }
      if (numericAge > 100) {
        return res.status(400).json({ message: 'Age must be between 18 and 100' });
      }
      if (!computedAge) {
        computedAge = numericAge;
      }
    }

    if (!computedAge) {
      return res.status(400).json({ message: 'Age or birth date is required to verify legal eligibility (18+)' });
    }

    // Required 4 Consent Agreements Validation
    const consent18 = is18OrOlder === true || consentAgreements?.is18OrOlder === true;
    const consentAccurate = isAccurateInfo === true || consentAgreements?.isAccurateInfo === true;
    const consentTerms = (
      acceptedTermsAndPrivacy === true ||
      agreedToTerms === true ||
      consentAgreements?.acceptedTermsAndPrivacy === true
    );
    const consentInactivity = (
      acceptedInactivityDeletion === true ||
      consentAgreements?.acceptedInactivityDeletion === true
    );

    if (!consent18 || !consentAccurate || !consentTerms || !consentInactivity) {
      return res.status(400).json({
        message: 'All 4 privacy, terms, age, and inactivity consent checkboxes are required and must be accepted.',
        missingConsents: {
          is18OrOlder: !consent18,
          isAccurateInfo: !consentAccurate,
          acceptedTermsAndPrivacy: !consentTerms,
          acceptedInactivityDeletion: !consentInactivity,
        },
      });
    }

    // Validate Policy Versions
    const policyVer = policyVersions?.privacyPolicy || '2.0';
    const supportedVersions = ['2.0'];
    if (!supportedVersions.includes(policyVer)) {
      return res.status(400).json({ message: 'Unsupported or outdated Privacy Policy version' });
    }

    // Check if user exists by email, username or phone number
    const trimmedUsername = typeof username === 'string' && username.trim() ? username.trim() : null;
    const trimmedPhone = typeof phoneNumber === 'string' && phoneNumber.trim() ? phoneNumber.trim() : null;

    const orConditions = [{ email: email.toLowerCase() }];
    if (trimmedUsername) {
      orConditions.push({ username: trimmedUsername });
    }
    if (trimmedPhone) {
      orConditions.push({ phoneNumber: trimmedPhone });
    }
    const existingUser = await User.findOne({ $or: orConditions });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return res.status(400).json({ message: 'Email is already registered' });
      }
      if (trimmedUsername && existingUser.username === trimmedUsername) {
        return res.status(400).json({ message: 'Username is already taken' });
      }
      if (trimmedPhone && existingUser.phoneNumber === trimmedPhone) {
        return res.status(400).json({ message: 'Phone number is already registered' });
      }
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user object with sanitized optional fields
    const userPayload = {
      name: name.trim(),
      email: email.toLowerCase(),
      password,
      gender: gender || 'male',
      interests: interests || '',
      hobbies: hobbies || '',
      language: ['en', 'si', 'ta'].includes(language) ? language : undefined,
      agreedToTerms: true,
      acknowledgedPrivacyPolicyAt: new Date(),
      acknowledgedPrivacyPolicyVersion: '2.0',
      lastActiveAt: new Date(),
      age: computedAge,
    };
    if (parsedBirthDate) userPayload.birthDate = parsedBirthDate;
    if (trimmedUsername) userPayload.username = trimmedUsername;
    if (trimmedPhone) userPayload.phoneNumber = trimmedPhone;

    const user = await User.create(userPayload);

    // Create protected, versioned PrivacyConsent audit record
    try {
      const ipAddress = req.headers['x-forwarded-for']
        ? req.headers['x-forwarded-for'].split(',')[0].trim()
        : req.ip || req.socket.remoteAddress || '';
      const userAgent = req.headers['user-agent'] || '';

      await PrivacyConsent.create({
        user: user._id,
        status: 'accepted',
        policyVersions: {
          privacyPolicy: '2.0',
          termsOfService: '2.0',
          communityGuidelines: '1.0',
        },
        language: ['en', 'si', 'ta'].includes(language) ? language : 'en',
        consentSource: 'web_registration',
        agreements: {
          is18OrOlder: true,
          isAccurateInfo: true,
          acceptedTermsAndPrivacy: true,
          acceptedInactivityDeletion: true,
        },
        acceptedAt: new Date(),
        ipAddress: String(ipAddress).slice(0, 45),
        userAgent: String(userAgent).slice(0, 250),
      });
    } catch (consentErr) {
      console.error('Failed to create initial PrivacyConsent record:', consentErr);
    }

    // Handle referral code if provided
    if (referralCode) {
      const validReferralCode = await ReferralCode.findOne({ code: referralCode, isActive: true });
      if (validReferralCode && validReferralCode.user.toString() !== user._id.toString()) {
        // Create referral record
        await Referral.create({
          referrer: validReferralCode.user,
          referred: user._id,
          referralCode: referralCode,
          status: 'pending'
        });

        // Update referrer stats
        validReferralCode.totalReferrals += 1;
        await validReferralCode.save();

        let referrerStats = await UserStats.findOne({ user: validReferralCode.user });
        if (!referrerStats) {
          referrerStats = new UserStats({ user: validReferralCode.user });
        }
        referrerStats.totalReferrals += 1;
        await referrerStats.save();

        // Give referred user bonus
        let userStats = await UserStats.findOne({ user: user._id });
        if (!userStats) {
          userStats = new UserStats({ user: user._id });
        }
        userStats.points += 25; // Bonus for using referral
        await userStats.save();
      }
    }

    if (user) {
      // Create profile picture reminder notification
      await Notification.create({
        user: user._id,
        type: 'profile_reminder',
        message: 'Add a profile picture to improve your profile visibility and receive better match suggestions.',
      });

      const accessToken = generateAccessToken(user);
      const refreshToken = await createRefreshToken(user, req);
      setTokenCookies(res, accessToken, refreshToken);

      logAuditEvent({
        userId: user._id,
        action: 'USER_REGISTERED',
        targetId: user._id,
        targetType: 'User',
        details: { email: user.email },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.status(201).json({
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        language: user.language,
        giftingOptIn: user.giftingOptIn,
        token: accessToken,
        refreshToken,
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password, twoFactorCode } = req.body;

    // Check for user email
    const user = await User.findOne({
      email: email ? email.toLowerCase().trim() : '',
    }).select('+password +twoFactorSecret +twoFactorRecoveryCodes');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check account lockout
    if (user.isAccountLocked && user.isAccountLocked()) {
      const minutesRemaining = Math.ceil((new Date(user.lockUntil).getTime() - Date.now()) / (60 * 1000));
      logAuditEvent({
        userId: user._id,
        action: 'LOGIN_LOCKED_ATTEMPT',
        severity: 'warning',
        details: { minutesRemaining },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      return res.status(423).json({
        message: `Account is temporarily locked due to repeated failed login attempts. Please try again in ${minutesRemaining} minutes.`,
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      if (user.incLoginAttempts) {
        await user.incLoginAttempts();
      }
      logAuditEvent({
        userId: user._id,
        action: 'LOGIN_FAILED',
        severity: 'warning',
        details: { email: user.email },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check active status
    if (user.isActive === false) {
      return res.status(403).json({
        message: 'Your account has been deactivated or suspended. Please contact support.',
      });
    }

    // 2FA check if enabled
    let is2FAAuthenticated = false;
    if (user.twoFactorEnabled) {
      if (!twoFactorCode) {
        return res.status(200).json({
          requires2FA: true,
          message: 'Two-factor authentication code required',
        });
      }

      // Verify code
      const validTOTP = verifyTOTP(twoFactorCode, user.twoFactorSecret);
      let validRecovery = false;

      if (!validTOTP && Array.isArray(user.twoFactorRecoveryCodes)) {
        const cleanCode = twoFactorCode.trim().toUpperCase();
        const codeIdx = user.twoFactorRecoveryCodes.indexOf(cleanCode);
        if (codeIdx !== -1) {
          validRecovery = true;
          user.twoFactorRecoveryCodes.splice(codeIdx, 1);
        }
      }

      if (!validTOTP && !validRecovery) {
        return res.status(401).json({ message: 'Invalid 2FA code or recovery code' });
      }
      is2FAAuthenticated = true;
    }

    // Reset login attempts after success
    if (user.resetLoginAttempts) {
      await user.resetLoginAttempts();
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    const accessToken = generateAccessToken(user, is2FAAuthenticated);
    const refreshToken = await createRefreshToken(user, req);
    setTokenCookies(res, accessToken, refreshToken);

    logAuditEvent({
      userId: user._id,
      action: 'LOGIN_SUCCESS',
      targetId: user._id,
      targetType: 'User',
      details: { email: user.email, is2FAAuthenticated },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
      profileImageUrl: user.profileImageUrl,
      language: user.language,
      giftingOptIn: user.giftingOptIn,
      token: accessToken,
      refreshToken,
      twoFactorEnabled: user.twoFactorEnabled,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload profile image to Cloudinary
// @route   POST /api/auth/upload-profile-image
// @access  Private
exports.uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an image' });
    }

    // Convert buffer to base64
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'matrimonial_profiles',
      resource_type: 'auto',
      transformation: [
        { width: 500, height: 500, crop: 'fill', gravity: 'face' },
        { quality: 'auto' },
      ],
    });

    // Update user profile
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profileImageUrl: result.secure_url },
      { new: true }
    );

    // Remove profile reminder notification if it exists
    await Notification.deleteMany({
      user: req.user._id,
      type: 'profile_reminder',
    });

    res.json({
      message: 'Profile image uploaded successfully',
      profileImageUrl: user.profileImageUrl,
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Request password reset email
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ message: 'If that email exists, a reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.passwordResetToken = hashedResetToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const resetUrl = `${getClientBaseUrl()}/reset-password/${resetToken}`;
    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl,
    });

    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Refresh access token using refresh token rotation
// @route   POST /api/auth/refresh
// @access  Public
exports.refreshToken = async (req, res) => {
  try {
    const rawToken = (req.cookies && req.cookies.refreshToken) || req.body.refreshToken;
    if (!rawToken) {
      return res.status(401).json({ message: 'Refresh token is required' });
    }

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const existingToken = await RefreshToken.findOne({ tokenHash });

    if (!existingToken) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Token reuse detection! If already revoked, invalidate all user sessions
    if (existingToken.isRevoked) {
      await RefreshToken.updateMany({ user: existingToken.user }, { isRevoked: true });
      await User.findByIdAndUpdate(existingToken.user, { $inc: { tokenVersion: 1 } });
      clearTokenCookies(res);

      logAuditEvent({
        userId: existingToken.user,
        action: 'REFRESH_TOKEN_REUSE_DETECTED',
        severity: 'critical',
        details: { tokenHash },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return res.status(403).json({
        message: 'Security alert: Refresh token reuse detected. All sessions have been revoked for your safety. Please log in again.',
      });
    }

    // Check expiration
    if (existingToken.expiresAt < new Date()) {
      existingToken.isRevoked = true;
      await existingToken.save();
      clearTokenCookies(res);
      return res.status(401).json({ message: 'Refresh token has expired. Please log in again.' });
    }

    // Find active user
    const user = await User.findById(existingToken.user);
    if (!user || user.isActive === false) {
      clearTokenCookies(res);
      return res.status(401).json({ message: 'User account inactive or not found' });
    }

    // Rotate refresh token: revoke current one and generate new one
    const newRawToken = crypto.randomBytes(40).toString('hex');
    const newTokenHash = crypto.createHash('sha256').update(newRawToken).digest('hex');
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    existingToken.isRevoked = true;
    existingToken.replacedByToken = newTokenHash;
    await existingToken.save();

    await RefreshToken.create({
      user: user._id,
      tokenHash: newTokenHash,
      expiresAt: newExpiresAt,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });

    const newAccessToken = generateAccessToken(user);
    setTokenCookies(res, newAccessToken, newRawToken);

    res.json({
      success: true,
      token: newAccessToken,
      refreshToken: newRawToken,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Logout user and invalidate refresh tokens
// @route   POST /api/auth/logout
// @access  Public / Private
exports.logout = async (req, res) => {
  try {
    const rawToken = (req.cookies && req.cookies.refreshToken) || req.body.refreshToken;
    if (rawToken) {
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      await RefreshToken.updateOne({ tokenHash }, { isRevoked: true });
    }

    if (req.user) {
      await User.updateOne({ _id: req.user._id }, { isOnline: false });
      logAuditEvent({
        userId: req.user._id,
        action: 'LOGOUT',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }

    clearTokenCookies(res);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset password with token
// @route   POST /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const hashedResetToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedResetToken,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      return res.status(400).json({ message: 'Reset link is invalid or has expired' });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = new Date();
    user.tokenVersion = (user.tokenVersion || 0) + 1; // Invalidate all existing tokens across devices
    await user.save();

    // Revoke all active refresh tokens on password change
    await RefreshToken.updateMany({ user: user._id }, { isRevoked: true });
    clearTokenCookies(res);

    logAuditEvent({
      userId: user._id,
      action: 'PASSWORD_RESET_COMPLETED',
      targetId: user._id,
      targetType: 'User',
      severity: 'warning',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ message: 'Password reset successful. Please log in with your new password.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2FA Endpoints
// @desc    Setup 2FA (Generate secret and URI)
// @route   POST /api/auth/2fa/setup
// @access  Private
exports.setup2FA = async (req, res) => {
  try {
    const secret = generateSecret();
    const otpauthUrl = getOTPAuthURI(req.user.email, secret, 'Kapu.lk');

    // Save temporary secret to user
    await User.findByIdAndUpdate(req.user._id, { twoFactorSecret: secret });

    res.json({
      success: true,
      secret,
      otpauthUrl,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify and activate 2FA
// @route   POST /api/auth/2fa/verify
// @access  Private
exports.verify2FA = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ message: 'Verification code is required' });
    }

    const user = await User.findById(req.user._id).select('+twoFactorSecret');
    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ message: '2FA setup was not initiated' });
    }

    const isValid = verifyTOTP(code, user.twoFactorSecret);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    const recoveryCodes = generateRecoveryCodes(8);
    user.twoFactorEnabled = true;
    user.twoFactorRecoveryCodes = recoveryCodes;
    await user.save();

    logAuditEvent({
      userId: user._id,
      action: '2FA_ENABLED',
      targetId: user._id,
      targetType: 'User',
      severity: 'warning',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      message: 'Two-factor authentication enabled successfully',
      recoveryCodes,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Disable 2FA
// @route   POST /api/auth/2fa/disable
// @access  Private
exports.disable2FA = async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid password. Cannot disable 2FA.' });
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.twoFactorRecoveryCodes = [];
    await user.save();

    logAuditEvent({
      userId: user._id,
      action: '2FA_DISABLED',
      targetId: user._id,
      targetType: 'User',
      severity: 'warning',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ success: true, message: 'Two-factor authentication disabled' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
