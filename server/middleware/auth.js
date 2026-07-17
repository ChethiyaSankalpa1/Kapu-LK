const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      // Update user isOnline status and lastLogin timestamp (throttled to once a minute)
      if (!req.user.isOnline || !req.user.lastLogin || Date.now() - new Date(req.user.lastLogin).getTime() > 60000) {
        try {
          req.user.isOnline = true;
          req.user.lastLogin = Date.now();
          await req.user.save();
        } catch (saveError) {
          console.error('Failed to save user online status:', saveError.message);
        }
      }

      next();
    } catch (error) {
      console.warn('JWT verification failed:', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Admin middleware
exports.admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as admin' });
  }
};

// Approved middleware
exports.approved = (req, res, next) => {
  if (req.user && (req.user.isApproved || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Account approval required. An administrator must approve your account before you can browse, search, or view other member profiles.' });
  }
};
