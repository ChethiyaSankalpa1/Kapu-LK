const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token from HttpOnly cookie OR Authorization Bearer header
exports.protect = async (req, res, next) => {
  let token;

  // 1. Try Bearer header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  // 2. Fallback to HttpOnly cookie
  else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';
    const decoded = jwt.verify(token, jwtSecret);

    // Attach decoded payload for 2FA / session claims inspection
    req.tokenPayload = decoded;

    // Get user from database
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user account no longer exists' });
    }

    // Reject deactivated or suspended users immediately
    if (user.isActive === false) {
      return res.status(403).json({
        message: 'Your account has been deactivated or suspended. Please contact support.',
      });
    }

    // Verify token version (session invalidation)
    if (decoded.tokenVersion !== undefined && user.tokenVersion !== undefined) {
      if (decoded.tokenVersion !== user.tokenVersion) {
        return res.status(401).json({ message: 'Session has been invalidated. Please log in again.' });
      }
    }

    // Reject tokens issued before a password change
    if (user.passwordChangedAt) {
      const changedTimestamp = parseInt(user.passwordChangedAt.getTime() / 1000, 10);
      if (decoded.iat && decoded.iat < changedTimestamp) {
        return res.status(401).json({
          message: 'Password was recently changed. Please log in again with your new credentials.',
        });
      }
    }

    req.user = user;

    // Throttle user online status updates to avoid DB pressure
    if (!user.isOnline || !user.lastLogin || Date.now() - new Date(user.lastLogin).getTime() > 60000) {
      User.updateOne({ _id: user._id }, { isOnline: true, lastLogin: new Date() }).catch((e) =>
        console.warn('Failed to update online status:', e.message)
      );
    }

    next();
  } catch (error) {
    console.warn('JWT verification failed:', error.message);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ message: 'Not authorized, invalid token' });
  }
};

// Admin role check
exports.admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as admin' });
  }
};

// Approved user check
exports.approved = (req, res, next) => {
  if (req.user && (req.user.isApproved || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({
      message:
        'Account approval required. An administrator must approve your account before you can browse, search, or view other member profiles.',
    });
  }
};

// Two-Factor Authentication requirement middleware
exports.require2FA = (req, res, next) => {
  if (req.user && req.user.twoFactorEnabled) {
    if (req.tokenPayload && req.tokenPayload.is2FAAuthenticated) {
      return next();
    }
    return res.status(403).json({
      success: false,
      requires2FA: true,
      message: 'Two-factor authentication code verification required for this action.',
    });
  }
  next();
};