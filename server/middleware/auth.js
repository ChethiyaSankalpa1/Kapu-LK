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

    // Mandatory email verification check for non-admin users
    const requireVerification = process.env.REQUIRE_EMAIL_VERIFICATION !== 'false';
    const isVerificationExempt = user.role === 'admin' || !requireVerification;

    if (!isVerificationExempt && !user.emailVerified) {
      // Allow only verification, auth-check, and mandatory onboarding endpoints.
      // Terms acceptance and email fix must work BEFORE email is verified.
      const allowedPaths = [
        '/verify-email',
        '/resend-verification-code',
        '/change-verification-email',
        '/fix-invalid-email',
        '/acknowledge-privacy-policy',
        '/logout',
        '/me',
        '/contact-admin',     // support while onboarding
      ];
      const isAllowed = allowedPaths.some((p) => req.originalUrl && req.originalUrl.includes(p));

      if (!isAllowed) {
        return res.status(403).json({
          success: false,
          code: 'EMAIL_VERIFICATION_REQUIRED',
          requiresEmailVerification: true,
          email: user.email,
          message: 'Please verify your email address to access this feature.',
        });
      }
    }

    req.user = user;

    // Throttle user online status & inactivity touch to avoid DB pressure (every 60 seconds)
    const now = new Date();
    const lastLoginTime = user.lastLogin ? new Date(user.lastLogin).getTime() : 0;
    const shouldUpdateActivity = !user.isOnline || !user.lastLogin || Date.now() - lastLoginTime > 60000;

    if (shouldUpdateActivity) {
      const updates = {
        isOnline: true,
        lastLogin: now,
        lastActiveAt: now,
      };

      // Reset inactivity process if active (user has returned!)
      if (user.inactivityReminderSentAt) {
        updates.inactivityReminderSentAt = null;
      }

      // Reset any active deletion warnings
      if (
        user.inactivityWarningsSent &&
        (user.inactivityWarningsSent.d5 || user.inactivityWarningsSent.d2 || user.inactivityWarningsSent.d1)
      ) {
        updates.inactivityWarningsSent = { d5: false, d2: false, d1: false };
      }

      User.updateOne({ _id: user._id }, { $set: updates }).catch((e) =>
        console.warn('Failed to update online / active status:', e.message)
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

// Optional auth middleware - sets req.user if valid token present, otherwise proceeds as guest
exports.optionalProtect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return next();
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';
    const decoded = jwt.verify(token, jwtSecret);
    const user = await User.findById(decoded.id).select('-password');
    if (user && user.isActive !== false) {
      req.user = user;
      req.tokenPayload = decoded;
    }
  } catch (error) {
    // Ignore invalid token for optional auth
  }
  next();
};