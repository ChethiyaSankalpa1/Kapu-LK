const jwt = require('jsonwebtoken');
const MaintenanceConfig = require('../models/MaintenanceConfig');

const getJwtSecret = () => process.env.JWT_SECRET || 'dev_jwt_secret_change_me';

// In-Memory Fast Cache
let cachedConfig = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 20000; // 20 seconds cache TTL

const getCachedMaintenanceConfig = async () => {
  const now = Date.now();
  if (cachedConfig && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedConfig;
  }

  try {
    const config = await MaintenanceConfig.getConfig();
    cachedConfig = config;
    lastCacheTime = now;
    return config;
  } catch (error) {
    console.error('[MaintenanceMiddleware] Fail-safe: DB unreachable, defaulting to inactive:', error.message);
    // Fail-Safe: Never lock admins or users out if DB is temporarily unreachable
    return {
      isActive: false,
      scope: 'full',
      affectedFeatures: [],
      title: { en: "We'll Be Back Soon!" },
      message: { en: "Routine maintenance in progress." },
    };
  }
};

const invalidateMaintenanceCache = () => {
  cachedConfig = null;
  lastCacheTime = 0;
};

// Check if request is authenticated as admin
const isAdminUser = (req) => {
  if (req.user && req.user.role === 'admin') {
    return true;
  }

  let token = null;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) return false;

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    if (decoded && decoded.role === 'admin') {
      req.isAdmin = true;
      return true;
    }
  } catch (err) {
    return false;
  }

  return false;
};

// Paths that must always bypass maintenance mode
const isExemptPath = (path, method) => {
  if (method === 'OPTIONS') return true;
  if (path === '/' || path === '/health') return true;
  if (path.startsWith('/api/maintenance')) return true;
  if (path.startsWith('/api/admin')) return true;
  if (path.startsWith('/api/auth/register')) return true;
  if (path.startsWith('/api/auth/login')) return true;
  if (path.startsWith('/api/auth/refresh')) return true;
  if (path.startsWith('/api/auth/logout')) return true;
  return false;
};

// Map URL paths and methods to features
const getAffectedFeatureFromRequest = (path, method) => {
  // Messaging
  if (path.startsWith('/api/messages') || path.startsWith('/api/typing')) {
    return 'messaging';
  }

  // Uploads
  if (path.includes('/upload') || path.includes('/upload-profile-image')) {
    return 'uploads';
  }

  // Profile Edit
  if (path === '/api/users/profile' && (method === 'PUT' || method === 'PATCH')) {
    return 'profile_edit';
  }

  // Payments & Wallet
  if (
    path.startsWith('/api/wallet') ||
    path.startsWith('/api/premium/request') ||
    path.startsWith('/api/premium/purchase-with-wallet')
  ) {
    return 'payments';
  }

  // Rewards & Redemptions
  if (path.startsWith('/api/redemption') || path.startsWith('/api/gifts')) {
    return 'rewards';
  }

  return null;
};

const maintenanceMiddleware = async (req, res, next) => {
  try {
    // 1. Check exempt endpoints
    if (isExemptPath(req.path, req.method)) {
      return next();
    }

    // 2. Check admin bypass
    if (isAdminUser(req)) {
      return next();
    }

    // 3. Retrieve maintenance configuration
    const config = await getCachedMaintenanceConfig();

    // Evaluate automatic scheduled window if set
    const now = new Date();
    let effectiveActive = Boolean(config.isActive);

    if (config.scheduledStartAt && now >= new Date(config.scheduledStartAt)) {
      if (!config.scheduledEndAt || now < new Date(config.scheduledEndAt)) {
        effectiveActive = true;
      } else {
        effectiveActive = false;
      }
    } else if (config.scheduledEndAt && now >= new Date(config.scheduledEndAt)) {
      effectiveActive = false;
    }

    if (!effectiveActive) {
      return next();
    }

    // Calculate Retry-After header (seconds)
    let retryAfterSeconds = 300; // Default 5 minutes
    if (config.expectedCompletionAt) {
      const diffSeconds = Math.round((new Date(config.expectedCompletionAt).getTime() - Date.now()) / 1000);
      if (diffSeconds > 0) {
        retryAfterSeconds = Math.min(diffSeconds, 86400); // Cap at 24 hours
      }
    }

    res.setHeader('Retry-After', String(retryAfterSeconds));

    // 4. Handle Full-Site Maintenance
    if (config.scope === 'full') {
      return res.status(503).json({
        maintenance: true,
        scope: 'full',
        title: config.title,
        message: config.message,
        reason: config.reason,
        expectedCompletionAt: config.expectedCompletionAt,
        supportContact: config.supportContact,
        comingSoon: config.comingSoon?.enabled
          ? {
              enabled: true,
              featureName: config.comingSoon.featureName,
              description: config.comingSoon.description,
              icon: config.comingSoon.icon,
              launchDate: config.comingSoon.launchDate,
            }
          : null,
      });
    }

    // 5. Handle Feature-Specific Maintenance
    if (config.scope === 'feature_specific' && Array.isArray(config.affectedFeatures)) {
      const matchedFeature = getAffectedFeatureFromRequest(req.path, req.method);

      if (matchedFeature && config.affectedFeatures.includes(matchedFeature)) {
        return res.status(503).json({
          maintenance: true,
          scope: 'feature_specific',
          feature: matchedFeature,
          title: config.title,
          message: {
            en: `${matchedFeature.replace('_', ' ').toUpperCase()} is temporarily unavailable due to maintenance.`,
            si: `මෙම විශේෂාංගය නඩත්තු කටයුතු හේතුවෙන් තාවකාලිකව අත්හිටුවා ඇත.`,
            ta: `பராமரிப்பு காரணமாக இந்த வசதி தற்காலிகமாக கிடைக்கவில்லை.`,
          },
          expectedCompletionAt: config.expectedCompletionAt,
          supportContact: config.supportContact,
        });
      }
    }

    // If feature is not affected, allow request to proceed normally
    return next();
  } catch (middlewareErr) {
    // Express does NOT catch async middleware throws automatically.
    // This catch-all ensures any stray DB/validation error cannot crash
    // the process or leave the connection hanging. Fail open = allow traffic.
    console.error('[MaintenanceMiddleware] Unhandled error, failing open:', middlewareErr && middlewareErr.message ? middlewareErr.message : middlewareErr);
    return next();
  }
};

module.exports = {
  maintenanceMiddleware,
  invalidateMaintenanceCache,
  getCachedMaintenanceConfig,
};
