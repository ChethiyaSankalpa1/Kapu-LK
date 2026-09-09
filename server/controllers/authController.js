const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { Referral, ReferralCode } = require('../models/Referral');
const { UserStats } = require('../models/Achievement');
const cloudinary = require('../config/cloudinary');
const { sendPasswordResetEmail } = require('../utils/mailer');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
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
      gender, 
      interests,
      hobbies,
      agreedToTerms,
      language,
      referralCode,
    } = req.body;

    if (!isValidPhoneNumber(phoneNumber)) {
      return res.status(400).json({ message: 'Phone number must contain only numbers' });
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
      agreedToTerms: !!agreedToTerms,
    };
    if (trimmedUsername) userPayload.username = trimmedUsername;
    if (trimmedPhone) userPayload.phoneNumber = trimmedPhone;
    if (age && !isNaN(Number(age))) userPayload.age = Number(age);

    const user = await User.create(userPayload);

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

      res.status(201).json({
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        language: user.language,
        giftingOptIn: user.giftingOptIn,
        token: generateToken(user._id),
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
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

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
      token: generateToken(user._id),
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
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
