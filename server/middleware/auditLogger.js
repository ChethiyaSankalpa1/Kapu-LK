const AuditLog = require('../models/AuditLog');

const REDACTED_KEYS = [
  'password',
  'token',
  'refreshtoken',
  'accesstoken',
  'secret',
  'twofactorsecret',
  'authorization',
  'cookie',
  'cardnumber',
  'cvv',
];

function sanitizeDetails(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeDetails);

  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (REDACTED_KEYS.some((rk) => lowerKey.includes(rk))) {
      clean[key] = '[REDACTED]';
    } else if (value && typeof value === 'object') {
      clean[key] = sanitizeDetails(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

/**
 * Persist an audit log entry asynchronously without blocking request handling.
 */
async function logAuditEvent({
  userId = null,
  action,
  targetId = null,
  targetType = 'System',
  details = {},
  ipAddress = '',
  userAgent = '',
  severity = 'info',
}) {
  try {
    await AuditLog.create({
      userId,
      action,
      targetId,
      targetType,
      details: sanitizeDetails(details),
      ipAddress: ipAddress ? String(ipAddress).slice(0, 45) : '',
      userAgent: userAgent ? String(userAgent).slice(0, 250) : '',
      severity,
    });
  } catch (err) {
    // Non-fatal, do not break application flow if audit logging fails
    console.error('AuditLog Error:', err.message);
  }
}

/**
 * Express middleware helper to extract client IP and user agent.
 */
function auditMiddleware(action, targetType = 'System') {
  return (req, res, next) => {
    const originalSend = res.send;
    res.send = function (data) {
      if (res.statusCode < 400) {
        logAuditEvent({
          userId: req.user ? req.user._id : null,
          action,
          targetType,
          details: req.body,
          ipAddress: req.ip || req.headers['x-forwarded-for'],
          userAgent: req.headers['user-agent'],
          severity: 'info',
        });
      }
      return originalSend.apply(this, arguments);
    };
    next();
  };
}

module.exports = {
  logAuditEvent,
  auditMiddleware,
  sanitizeDetails,
};