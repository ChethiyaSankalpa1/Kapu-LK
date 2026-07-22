const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Notification = require('../models/Notification');
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
    } = req.body;

    if (!isValidPhoneNumber(phoneNumber)) {
      return res.status(400).json({ message: 'Phone number must contain only numbers' });
    }

    // Check if user exists by email, username or phone number
    const orConditions = [{ email }, { username }];
    if (phoneNumber) {
      orConditions.push({ phoneNumber });
    }
    const existingUser = await User.findOne({ $or: orConditions });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ message: 'Email is already registered' });
      }
      if (existingUser.username === username) {
        return res.status(400).json({ message: 'Username is already taken' });
      }
      if (phoneNumber && existingUser.phoneNumber === phoneNumber) {
        return res.status(400).json({ message: 'Phone number is already registered' });
      }
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      name,
      username,
      email,
      password,
      phoneNumber,
      age,
      gender,
      interests,
      hobbies,
      language: ['en', 'si', 'ta'].includes(language) ? language : undefined,
      agreedToTerms: !!agreedToTerms,
    });

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
