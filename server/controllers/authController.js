const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User');
const PrivacyConsent = require('../models/PrivacyConsent');
const RefreshToken = require('../models/RefreshToken');
const Notification = require('../models/Notification');
const { Referral, ReferralCode } = require('../models/Referral');
const { UserStats } = require('../models/Achievement');
const cloudinary = require('../config/cloudinary');
const {
  sendEmailVerificationCode,
  sendPasswordResetCode,
  sendWelcomeEmail,
  sendPasswordResetEmail,
} = require('../services/emailService');
const { checkAndSendWelcomeEmail } = require('../services/welcomeEmailService');
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
      emailVerified: !!user.emailVerified,
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

const isValidEmail = (value) => {
  if (!value || typeof value !== 'string') return false;
  const normalized = value.toLowerCase().trim();
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(normalized);
};

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

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

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
    const normalizedEmail = String(email || '').toLowerCase().trim();

    const orConditions = [{ email: normalizedEmail }];
    if (trimmedUsername) {
      orConditions.push({ username: { $regex: new RegExp(`^${trimmedUsername.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`), $options: 'i' } });
    }
    if (trimmedPhone) {
      orConditions.push({ phoneNumber: trimmedPhone });
    }
    const existingUser = await User.findOne({ $or: orConditions });

    if (existingUser) {
      const conflicts = [];
      const existingEmail = (existingUser.email || '').toLowerCase().trim();
      if (existingEmail === normalizedEmail) {
        conflicts.push('email');
      }
      const existingUsername = existingUser.username ? String(existingUser.username) : '';
      if (trimmedUsername && existingUsername && existingUsername.toLowerCase() === trimmedUsername.toLowerCase()) {
        conflicts.push('username');
      }
      const existingPhone = existingUser.phoneNumber ? String(existingUser.phoneNumber).trim() : '';
      if (trimmedPhone && existingPhone === trimmedPhone) {
        conflicts.push('phone number');
      }

      if (conflicts.length > 0) {
        const conflictStr = conflicts.length === 1
          ? conflicts[0]
          : conflicts.slice(0, -1).join(', ') + ' and ' + conflicts[conflicts.length - 1];
        const capitalized = conflictStr.charAt(0).toUpperCase() + conflictStr.slice(1);
        return res.status(400).json({
          message: `${capitalized} ${conflicts.length === 1 ? 'is' : 'are'} already registered. Please try logging in or use different credentials.`,
        });
      }

      // Catch-all: very rare (match on case variant of any field that got normalized)
      return res.status(400).json({
        message: 'An account with these credentials already exists. Please try logging in or use different credentials.',
      });
    }

    // Create user object with sanitized optional fields
    const userPayload = {
      name: String(name || '').trim(),
      email: String(email || '').toLowerCase(),
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
      emailVerified: false,
      isEmailVerified: false,
      accountStatus: 'active',
    };
    if (parsedBirthDate) userPayload.birthDate = parsedBirthDate;
    if (trimmedUsername) userPayload.username = trimmedUsername;
    if (trimmedPhone) userPayload.phoneNumber = trimmedPhone;

    // Generate 6-digit cryptographically secure verification code
    const verificationCode = crypto.randomInt(100000, 1000000).toString();
    const hashedCode = crypto.createHash('sha256').update(verificationCode).digest('hex');
    userPayload.emailVerificationCode = hashedCode;
    userPayload.emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000);
    userPayload.emailVerificationAttempts = 0;
    userPayload.emailVerificationCooldown = new Date(Date.now() + 60 * 1000);

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

      // Dispatch branded email verification code non-blocking (fire-and-forget with error logging)
      // Not awaited so slow SMTP cannot hang the registration response or cause user retries/duplicates
      sendEmailVerificationCode({
        to: user.email,
        name: user.name,
        code: verificationCode,
        expiresMinutes: 15,
      })
        .then((emailResult) => {
          if (emailResult && emailResult.success === false) {
            console.warn('[Register] Failed to send verification code email:', emailResult.error);
          }
        })
        .catch((emailErr) => {
          console.error('[Register] Exception while dispatching verification email:', emailErr && emailErr.message ? emailErr.message : emailErr);
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
        emailVerified: false,
        requiresEmailVerification: true,
        language: user.language,
        giftingOptIn: user.giftingOptIn,
        token: accessToken,
        refreshToken,
        message: 'Registration successful! A 6-digit verification code has been sent to your email.',
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    // Handle MongoDB E11000 duplicate-key errors (TOCTOU race / leftover indexes)
    if (error && error.code === 11000 && error.keyPattern) {
      const keyFields = Object.keys(error.keyPattern || {});
      let message = 'An account with these credentials already exists. Please try logging in.';
      if (keyFields.includes('email')) {
        message = 'Email is already registered';
      } else if (keyFields.includes('username')) {
        message = 'Username is already taken';
      } else if (keyFields.includes('phoneNumber') || keyFields.includes('phone')) {
        message = 'Phone number is already registered';
      }
      console.warn('[register] E11000 duplicate key after pre-check for:', keyFields, error.keyValue || '');
      return res.status(400).json({ message });
    }
    console.error('[register] Unhandled error:', error && error.message || error);
    res.status(500).json({ message: 'Server error during registration. Please try again or contact support if the problem continues.' });
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

    // Check active status with automatic reactivation for 10-day inactivity
    if (user.isActive === false) {
      if (user.deactivationReason === 'inactivity_10_days' || user.accountStatus === 'deactivated') {
        user.isActive = true;
        user.accountStatus = 'active';
        user.deactivatedAt = null;
        user.deactivationReason = null;
        user.inactivityReminderSentAt = null;
        user.lastActiveAt = new Date();
        await user.save();
        logAuditEvent({
          userId: user._id,
          action: 'ACCOUNT_REACTIVATED_BY_LOGIN',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });
      } else {
        return res.status(403).json({
          message: 'Your account has been deactivated or suspended. Please contact support at kapulk.support@gmail.com.',
        });
      }
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

    // Handle mandatory email verification for existing or new non-admin members
    const requireVerification = process.env.REQUIRE_EMAIL_VERIFICATION !== 'false';
    const isUnverifiedMember = user.role !== 'admin' && requireVerification && !user.emailVerified;

    if (isUnverifiedMember) {
      // Send a fresh verification code if cooldown has passed
      const canSend = !user.emailVerificationCooldown || user.emailVerificationCooldown <= Date.now();
      if (canSend) {
        const verificationCode = crypto.randomInt(100000, 1000000).toString();
        const hashedCode = crypto.createHash('sha256').update(verificationCode).digest('hex');
        user.emailVerificationCode = hashedCode;
        user.emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000);
        user.emailVerificationAttempts = 0;
        user.emailVerificationCooldown = new Date(Date.now() + 60 * 1000);

        const emailResult = await sendEmailVerificationCode({
          to: user.email,
          name: user.name,
          code: verificationCode,
          expiresMinutes: 15,
        });

        if (emailResult && emailResult.success === false) {
          console.warn('[Login] Failed to dispatch email verification code:', emailResult.error);
        }
      }
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
      emailVerified: user.role === 'admin' ? true : !!user.emailVerified,
      requiresEmailVerification: isUnverifiedMember,
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

    // Check if profile is complete and send welcome email once
    try {
      await checkAndSendWelcomeEmail(user._id);
    } catch (err) {
      console.warn('[WelcomeEmail] Error checking welcome email on uploadProfileImage:', err.message);
    }

    res.json({
      message: 'Profile image uploaded successfully',
      profileImageUrl: user.profileImageUrl,
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Request password reset email with 6-digit single-use OTP code
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: 'A valid email address is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    
    // Validate email format before proceeding
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    const user = await User.findOne({ email: normalizedEmail });

    // Protect Admin: Admin cannot use forgot-password flow
    if (user && user.role !== 'admin') {
      // Generate cryptographically secure 6-digit verification code
      const resetCode = crypto.randomInt(100000, 1000000).toString();
      const hashedCode = crypto.createHash('sha256').update(resetCode).digest('hex');

      const expiresMinutes = parseInt(process.env.RESET_CODE_EXPIRES_MINUTES, 10) || 10;
      user.passwordResetCode = hashedCode;
      user.passwordResetCodeExpires = new Date(Date.now() + expiresMinutes * 60 * 1000);
      user.passwordResetCodeAttempts = 0;

      // Invalidate any previously active reset tokens or codes
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;

      await user.save();

      // Dispatch branded OTP code email
      const emailResult = await sendPasswordResetCode({
        to: user.email,
        name: user.name,
        code: resetCode,
        expiresMinutes,
      });

      if (emailResult && emailResult.success === false) {
        console.warn('[ForgotPassword] Failed to dispatch reset email:', emailResult.error);
        return res.status(502).json({
          message: `Failed to send password reset email: ${emailResult.error || 'SMTP error'}.`,
          error: emailResult.error,
        });
      }

      logAuditEvent({
        userId: user._id,
        action: 'PASSWORD_RESET_OTP_REQUESTED',
        details: { email: user.email },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }

    // Always return identical generic message to prevent account enumeration
    return res.json({
      success: true,
      message: 'If that email exists in our system, a 6-digit verification code has been sent.',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify 6-digit password reset OTP and receive short-lived reset token
// @route   POST /api/auth/verify-reset-code
// @access  Public
exports.verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ message: 'Email and 6-digit verification code are required' });
    }

    const cleanCode = String(code).trim();
    if (!/^\d{6}$/.test(cleanCode)) {
      return res.status(400).json({ message: 'Verification code must be exactly 6 digits' });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select('+passwordResetCode +passwordResetCodeExpires +passwordResetCodeAttempts');

    if (!user || !user.passwordResetCode || !user.passwordResetCodeExpires) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    // Check expiration
    if (user.passwordResetCodeExpires < new Date()) {
      user.passwordResetCode = undefined;
      user.passwordResetCodeExpires = undefined;
      await user.save();
      return res.status(400).json({ message: 'Verification code has expired. Please request a new code.' });
    }

    // Check attempts limit (Max 5 failed attempts locks the code)
    if ((user.passwordResetCodeAttempts || 0) >= 5) {
      user.passwordResetCode = undefined;
      user.passwordResetCodeExpires = undefined;
      await user.save();
      return res.status(400).json({
        message: 'Too many incorrect attempts. For your security, this code was invalidated. Please request a new code.',
      });
    }

    // Timing-safe comparison of SHA-256 hashes
    const candidateHash = crypto.createHash('sha256').update(cleanCode).digest('hex');
    const candidateBuf = Buffer.from(candidateHash, 'hex');
    const storedBuf = Buffer.from(user.passwordResetCode || '', 'hex');
    let isMatch = false;
    try {
      if (candidateBuf.length === storedBuf.length && candidateBuf.length > 0) {
        isMatch = crypto.timingSafeEqual(candidateBuf, storedBuf);
      }
    } catch (_e) {
      isMatch = false;
    }

    if (!isMatch) {
      user.passwordResetCodeAttempts = (user.passwordResetCodeAttempts || 0) + 1;
      await user.save();
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    // Code matches! Invalidate the OTP code immediately (single-use)
    user.passwordResetCode = undefined;
    user.passwordResetCodeExpires = undefined;
    user.passwordResetCodeAttempts = 0;

    // Issue short-lived, cryptographically secure reset token (15 minutes)
    const rawResetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = crypto.createHash('sha256').update(rawResetToken).digest('hex');

    user.passwordResetToken = hashedResetToken;
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    await user.save();

    logAuditEvent({
      userId: user._id,
      action: 'PASSWORD_RESET_CODE_VERIFIED',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({
      success: true,
      resetToken: rawResetToken,
      message: 'Code verified successfully. Please enter your new password.',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify user email address using 6-digit OTP code
// @route   POST /api/auth/verify-email
// @access  Public / Restricted
exports.verifyEmail = async (req, res) => {
  try {
    const code = req.body.code;
    const email = (req.body.email || (req.user && req.user.email) || '').toLowerCase().trim();

    if (!email || !code) {
      return res.status(400).json({ message: 'Email and 6-digit verification code are required' });
    }

    const cleanCode = String(code).trim();
    if (!/^\d{6}$/.test(cleanCode)) {
      return res.status(400).json({ message: 'Verification code must be exactly 6 digits' });
    }

    // Find user by either primary email or pending email
    const user = await User.findOne({ 
      $or: [
        { email: email },
        { pendingEmail: email }
      ]
    }).select(
      '+emailVerificationCode +emailVerificationExpires +emailVerificationAttempts +pendingEmail'
    );

    if (!user) {
      return res.status(404).json({ message: 'User account not found' });
    }

    if (user.emailVerified && !user.pendingEmail) {
      return res.json({
        success: true,
        emailVerified: true,
        requiresEmailVerification: false,
        message: 'Your email is already verified. You can access Kapu-LK.',
      });
    }

    if (!user.emailVerificationCode || !user.emailVerificationExpires) {
      return res.status(400).json({
        message: 'No active verification code found. Please request a new code.',
      });
    }

    if (user.emailVerificationExpires < new Date()) {
      user.emailVerificationCode = undefined;
      user.emailVerificationExpires = undefined;
      user.pendingEmail = undefined;
      await user.save();
      return res.status(400).json({
        message: 'Verification code has expired. Please request a new code.',
      });
    }

    if ((user.emailVerificationAttempts || 0) >= 5) {
      user.emailVerificationCode = undefined;
      user.emailVerificationExpires = undefined;
      user.pendingEmail = undefined;
      await user.save();
      return res.status(400).json({
        message: 'Too many incorrect attempts. This code was invalidated for your protection. Please request a new code.',
      });
    }

    // Timing-safe comparison of SHA-256 hash
    const candidateHash = crypto.createHash('sha256').update(cleanCode).digest('hex');
    const candidateBuf = Buffer.from(candidateHash, 'hex');
    const storedBuf = Buffer.from(user.emailVerificationCode || '', 'hex');
    let isMatch = false;
    try {
      if (candidateBuf.length === storedBuf.length && candidateBuf.length > 0) {
        isMatch = crypto.timingSafeEqual(candidateBuf, storedBuf);
      }
    } catch (_e) {
      isMatch = false;
    }

    if (!isMatch) {
      user.emailVerificationAttempts = (user.emailVerificationAttempts || 0) + 1;
      await user.save();
      return res.status(400).json({ message: 'Invalid or incorrect verification code' });
    }

    // Verified successfully!
    const previousEmail = user.email;
    
    // If there's a pending email, it means the user is changing their email
    if (user.pendingEmail && user.pendingEmail === email) {
      user.email = user.pendingEmail;
      user.pendingEmail = undefined;
    }
    
    user.emailVerified = true;
    user.isEmailVerified = true;
    user.emailVerifiedAt = new Date();
    user.emailVerificationCode = undefined;
    user.emailVerificationExpires = undefined;
    user.emailVerificationAttempts = 0;
    user.lastActiveAt = new Date();
    await user.save();

    // Check if profile is already complete and trigger welcome email
    try {
      await checkAndSendWelcomeEmail(user._id);
    } catch (err) {
      console.warn('[WelcomeEmail] Error checking welcome email on verifyEmail:', err.message);
    }

    // Issue full unrestricted token
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = await createRefreshToken(user, req);
    setTokenCookies(res, newAccessToken, newRefreshToken);

    logAuditEvent({
      userId: user._id,
      action: 'EMAIL_VERIFIED_SUCCESS',
      details: { 
        previousEmail: previousEmail !== user.email ? previousEmail : undefined,
        newEmail: user.email 
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      emailVerified: true,
      requiresEmailVerification: false,
      email: user.email,
      emailChanged: previousEmail !== user.email,
      token: newAccessToken,
      refreshToken: newRefreshToken,
      message: previousEmail !== user.email 
        ? 'Email updated and verified successfully! Welcome to Kapu-LK.'
        : 'Email verified successfully! Welcome to Kapu-LK.',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Resend email verification 6-digit OTP code
// @route   POST /api/auth/resend-verification-code
// @access  Public / Restricted
exports.resendVerificationCode = async (req, res) => {
  try {
    const email = (req.body.email || (req.user && req.user.email) || '').toLowerCase().trim();
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email }).select('+emailVerificationCooldown');
    if (!user) {
      return res.status(404).json({ message: 'User account not found' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: 'Email address is already verified' });
    }

    // Enforce 60-second cooldown
    if (user.emailVerificationCooldown && user.emailVerificationCooldown > Date.now()) {
      const secondsLeft = Math.ceil((user.emailVerificationCooldown.getTime() - Date.now()) / 1000);
      return res.status(429).json({
        message: `Please wait ${secondsLeft} seconds before requesting another code.`,
        retryAfter: secondsLeft,
      });
    }

    const verificationCode = crypto.randomInt(100000, 1000000).toString();
    const hashedCode = crypto.createHash('sha256').update(verificationCode).digest('hex');

    user.emailVerificationCode = hashedCode;
    user.emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000);
    user.emailVerificationAttempts = 0;
    user.emailVerificationCooldown = new Date(Date.now() + 60 * 1000); // 60s cooldown
    await user.save();

    const emailResult = await sendEmailVerificationCode({
      to: user.email,
      name: user.name,
      code: verificationCode,
      expiresMinutes: 15,
    });

    logAuditEvent({
      userId: user._id,
      action: 'EMAIL_VERIFICATION_CODE_RESENT',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    if (emailResult && emailResult.success === false) {
      console.warn('[ResendVerification] Failed to dispatch email:', emailResult.error);
      return res.status(502).json({
        message: `Email delivery failed: ${emailResult.error || 'SMTP server error'}. Please verify credentials.`,
        error: emailResult.error,
      });
    }

    res.json({
      success: true,
      message: 'A fresh 6-digit verification code has been sent to your email.',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Change unverified email address and request fresh verification code
// @route   POST /api/auth/change-verification-email
// @access  Public / Restricted
exports.changeVerificationEmail = async (req, res) => {
  try {
    const { oldEmail, newEmail } = req.body;
    const cleanNewEmail = String(newEmail || '').toLowerCase().trim();
    const cleanOldEmail = String(oldEmail || (req.user && req.user.email) || '').toLowerCase().trim();

    if (!cleanNewEmail || !/^\S+@\S+\.\S+$/.test(cleanNewEmail)) {
      return res.status(400).json({ message: 'A valid new email address is required' });
    }

    if (cleanNewEmail === cleanOldEmail) {
      return res.status(400).json({ message: 'New email address must be different from current email' });
    }

    // Check if new email is already registered by any other account
    const existingUser = await User.findOne({ email: cleanNewEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'This email address is already registered to another account' });
    }

    let user;
    if (req.user) {
      user = await User.findById(req.user._id).select('+emailVerificationCooldown');
    } else if (cleanOldEmail) {
      user = await User.findOne({ email: cleanOldEmail }).select('+emailVerificationCooldown');
    }

    if (!user) {
      return res.status(404).json({ message: 'User account not found' });
    }

    if (user.emailVerified && !user.pendingEmail) {
      return res.status(400).json({ message: 'This email address is already verified and cannot be changed here' });
    }

    // Enforce 60-second cooldown
    if (user.emailVerificationCooldown && user.emailVerificationCooldown > Date.now()) {
      const secondsLeft = Math.ceil((user.emailVerificationCooldown.getTime() - Date.now()) / 1000);
      return res.status(429).json({
        message: `Please wait ${secondsLeft} seconds before requesting another code.`,
        retryAfter: secondsLeft,
      });
    }

    const verificationCode = crypto.randomInt(100000, 1000000).toString();
    const hashedCode = crypto.createHash('sha256').update(verificationCode).digest('hex');

    const previousEmail = user.email;
    // Store new email in pendingEmail field instead of updating primary email
    user.pendingEmail = cleanNewEmail;
    user.emailVerificationCode = hashedCode;
    user.emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000);
    user.emailVerificationAttempts = 0;
    user.emailVerificationCooldown = new Date(Date.now() + 60 * 1000); // 60s cooldown
    await user.save();

    const emailResult = await sendEmailVerificationCode({
      to: cleanNewEmail,
      name: user.name,
      code: verificationCode,
      expiresMinutes: 15,
    });

    logAuditEvent({
      userId: user._id,
      action: 'EMAIL_CHANGE_REQUESTED',
      details: { previousEmail, pendingEmail: cleanNewEmail },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    if (emailResult && emailResult.success === false) {
      console.warn('[ChangeVerificationEmail] Failed to dispatch email:', emailResult.error);
      return res.status(502).json({
        message: `Email change requested, but dispatch failed: ${emailResult.error || 'SMTP server error'}. Please verify credentials.`,
        error: emailResult.error,
      });
    }

    res.json({
      success: true,
      pendingEmail: cleanNewEmail,
      message: `Email change requested! A verification code has been sent to ${cleanNewEmail}. Please verify to complete the change.`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Fix invalid email for authenticated users with password confirmation
// @route   POST /api/auth/fix-invalid-email
// @access  Private
exports.fixInvalidEmail = async (req, res) => {
  try {
    const { newEmail, password } = req.body;
    const cleanNewEmail = String(newEmail || '').toLowerCase().trim();

    if (!cleanNewEmail || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(cleanNewEmail)) {
      return res.status(400).json({ message: 'A valid email address is required' });
    }

    if (!password) {
      return res.status(400).json({ message: 'Password confirmation is required' });
    }

    const user = await User.findById(req.user._id).select('+password +emailVerificationCooldown');

    if (!user) {
      return res.status(404).json({ message: 'User account not found' });
    }

    // Verify password
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Check if new email is already registered by any other account
    const existingUser = await User.findOne({ 
      email: cleanNewEmail,
      _id: { $ne: user._id }
    });
    if (existingUser) {
      return res.status(400).json({ message: 'This email address is already registered to another account' });
    }

    // Enforce 60-second cooldown
    if (user.emailVerificationCooldown && user.emailVerificationCooldown > Date.now()) {
      const secondsLeft = Math.ceil((user.emailVerificationCooldown.getTime() - Date.now()) / 1000);
      return res.status(429).json({
        message: `Please wait ${secondsLeft} seconds before requesting another code.`,
        retryAfter: secondsLeft,
      });
    }

    const verificationCode = crypto.randomInt(100000, 1000000).toString();
    const hashedCode = crypto.createHash('sha256').update(verificationCode).digest('hex');

    const previousEmail = user.email;
    // Store new email in pendingEmail field
    user.pendingEmail = cleanNewEmail;
    user.emailVerificationCode = hashedCode;
    user.emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000);
    user.emailVerificationAttempts = 0;
    user.emailVerificationCooldown = new Date(Date.now() + 60 * 1000);
    await user.save();

    const emailResult = await sendEmailVerificationCode({
      to: cleanNewEmail,
      name: user.name,
      code: verificationCode,
      expiresMinutes: 15,
    });

    logAuditEvent({
      userId: user._id,
      action: 'INVALID_EMAIL_FIX_REQUESTED',
      details: { previousEmail, pendingEmail: cleanNewEmail },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    if (emailResult && emailResult.success === false) {
      console.warn('[FixInvalidEmail] Failed to dispatch email:', emailResult.error);
      return res.status(502).json({
        message: `Email fix requested, but dispatch failed: ${emailResult.error || 'SMTP server error'}. Please verify credentials.`,
        error: emailResult.error,
      });
    }

    res.json({
      success: true,
      pendingEmail: cleanNewEmail,
      message: `Email fix requested! A verification code has been sent to ${cleanNewEmail}. Please verify to complete the email update.`,
    });
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

// @desc    Reset password with reset token (from body or URL param)
// @route   POST /api/auth/reset-password
// @route   POST /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const token = req.params.token || req.body.resetToken || req.body.token;
    const { password } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Reset token is required' });
    }

    if (!password || String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const hashedResetToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedResetToken,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      return res.status(400).json({ message: 'Reset token is invalid or has expired. Please request a new code.' });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetCode = undefined;
    user.passwordResetCodeExpires = undefined;
    user.passwordResetCodeAttempts = 0;
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
