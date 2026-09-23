const express = require('express');
const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { seedUsers, seedAchievements, seedGifts } = require('./utils/seeder');
const { migrateEmailVerification } = require('./scripts/migrateEmailVerification');
const { startMessageCleanup } = require('./utils/messageCleanup');
const { startNotificationCleanup } = require('./utils/notificationCleanup');

// Load env vars
dotenv.config({ override: true });

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// =========================================================================
// UNIVERSAL ASYNC-ROUTE ERROR GUARD  (must run BEFORE any route is mounted)
// -------------------------------------------------------------------------
// Express 4 does NOT catch rejected promises returned by `async` route
// handlers or middlewares.  Without this, ANY throw inside an async handler
// becomes an unhandled rejection -> either process death (pre-fix) or
// (after our process guards below) a request that HANGS FOREVER with no
// response, which the browser reports as either ERR_CONNECTION_CLOSED or
// a generic 500 from the reverse proxy.
//
// Strategy: monkey-patch the 7 routing verbs on Express.Router.VERB so
// that every middleware / handler registered is scanned; any function whose
// constructor name is "AsyncFunction" (i.e. declared with `async`) is
// transparently wrapped with `.catch(next)` which funnels the error into
// Express's normal error handling pipeline (and our own error handler
// near the bottom of this file).
//
// This catches EVERY async controller and middleware retroactively, not
// just the ones we remember to manually wrap.
// =========================================================================
(function installAsyncErrorGuard() {
  const Router = require('express').Router;
  const original = Router.prototype;
  const verbs = ['use', 'all', 'get', 'post', 'put', 'delete', 'patch', 'options', 'head'];
  function isAsyncFn(fn) {
    return typeof fn === 'function' && Object.prototype.toString.call(fn) === '[object AsyncFunction]';
  }
  function wrapAsync(fn) {
    const wrapped = function asyncGuardWrapper(req, res, next) {
      const ret = fn.apply(this, arguments);
      if (ret && typeof ret.catch === 'function') {
        ret.catch((err) => {
          try { next(err); } catch (_nextErr) { /* belt and suspenders */ }
        });
      }
      return ret;
    };
    try {
      Object.defineProperty(wrapped, 'name', { value: (fn.name || 'anon') + '__asyncGuard', configurable: true });
    } catch (_e) { /* noop */ }
    return wrapped;
  }
  verbs.forEach((method) => {
    const originalFn = original[method];
    if (typeof originalFn !== 'function') return;
    original[method] = function () {
      const args = new Array(arguments.length);
      for (let i = 0; i < args.length; i++) {
        let arg = arguments[i];
        if (Array.isArray(arg)) {
          arg = arg.map((item) => (isAsyncFn(item) ? wrapAsync(item) : item));
        } else if (isAsyncFn(arg)) {
          arg = wrapAsync(arg);
        }
        args[i] = arg;
      }
      return originalFn.apply(this, args);
    };
  });
})();

// Global process guards — MUST be installed as early as possible.
// These prevent unhandled promise rejections or stray synchronous throws
// (e.g. inside a fire-and-forget email send, mongoose model validation
// bubble-up, etc.) from killing the entire Node process which would
// surface to the browser as net::ERR_CONNECTION_CLOSED.
process.on('uncaughtException', (err) => {
  console.error('[FATAL] uncaughtException:', err && err.stack ? err.stack : err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error(
    '[FATAL] unhandledRejection at:',
    promise && promise.constructor ? promise.constructor.name : 'Promise',
    'reason:',
    reason && reason.stack ? reason.stack : reason
  );
});

if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.warn('JWT not configured: missing JWT_SECRET in environment');
  } else {
    process.env.JWT_SECRET = 'dev_jwt_secret_change_me';
    console.warn('JWT not configured: missing JWT_SECRET. Using a development default.');
  }
}

// Connect to database
let dbConnected = false;
(async () => {
  dbConnected = await connectDB();
  if (dbConnected) {
    // Safety: only seed / cleanup when explicitly enabled
    const allowSeed = process.env.ENABLE_SEEDER === 'true' || process.env.NODE_ENV !== 'production';
    const allowCleanup = process.env.ENABLE_MESSAGE_CLEANUP !== 'false';
    const allowNotificationCleanup = process.env.ENABLE_NOTIFICATION_CLEANUP !== 'false';

    if (allowSeed) {
      await seedUsers();
      await seedAchievements();
      await seedGifts();
    }
    if (allowCleanup) {
      startMessageCleanup();
    }
    if (allowNotificationCleanup) {
      startNotificationCleanup();
    }

    // Run safe email verification schema migration on boot (idempotent)
    try {
      await migrateEmailVerification(true);
    } catch (e) {
      console.warn('[Migration] Boot email verification migration skipped:', e.message);
    }

    const allowDupMerge = process.env.ENABLE_NOTIFICATION_DUP_MERGE !== 'false';
    if (allowDupMerge) {
      try {
        const { mergeProfileViewDuplicates } = require('./controllers/notificationController');
        (async () => {
          try {
            const r = await mergeProfileViewDuplicates(null);
            if (r && (r.mergedGroups > 0 || r.deletedDocs > 0)) {
              console.log(
                `[NotificationDupMerge] Boot cleanup: merged ${r.mergedGroups} duplicate group(s), deleted ${r.deletedDocs} redundant doc(s)`
              );
            }
          } catch (e) {
            console.warn('[NotificationDupMerge] Boot merge skipped:', e.message);
          }
        })();
      } catch (e) {
        console.warn('[NotificationDupMerge] Failed to init boot merge:', e.message);
      }
    }
  }
})();

const cookieParser = require('cookie-parser');

const app = express();

app.set('trust proxy', 1);

// Cookie parser for secure HttpOnly cookie authentication
app.use(cookieParser());

// Security headers with strict Content Security Policy
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com", "https://*.vercel.app"],
      connectSrc: ["'self'", "https://*.onrender.com", "https://*.vercel.app", "http://localhost:*", "ws:", "wss:"],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  frameguard: { action: 'deny' },
}));

// Response compression
app.use(compression());

// Static file caching headers
app.use((req, res, next) => {
  if (req.url.match(/\.(jpg|jpeg|png|gif|webp|svg|ico|css|js)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  next();
});

// CORS configuration
const knownOrigins = [
  'https://kapu-lk-client.vercel.app',
  'https://client-khaki-beta.vercel.app',
  'http://localhost:3000',
  'http://localhost:5000',
];
const corsOriginEnv = process.env.CORS_ORIGIN;
const envOrigins = corsOriginEnv
  ? corsOriginEnv.split(',').map((s) => s.trim()).filter(Boolean)
  : [];
const allowedOrigins = [...new Set([...knownOrigins, ...envOrigins])];

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  try {
    const parsed = new URL(origin);
    const host = parsed.hostname;
    if (
      host.endsWith('.vercel.app') ||
      host.endsWith('.onrender.com') ||
      host === 'localhost' ||
      host === '127.0.0.1'
    ) {
      return true;
    }
  } catch (e) {
    if (origin.endsWith('.vercel.app') || origin.endsWith('.onrender.com') || origin.includes('localhost')) {
      return true;
    }
  }
  return false;
};

// Top-level guaranteed CORS headers for all requests (including preflight and error responses)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (isOriginAllowed(origin)) {
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] || '*');
    res.setHeader('Access-Control-Expose-Headers', '*');
    res.setHeader('Access-Control-Max-Age', '86400');
  }

  // Immediately respond to OPTIONS preflight without hitting downstream middlewares
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

const corsOptions = {
  origin: function (origin, callback) {
    return callback(null, isOriginAllowed(origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Basic rate limiting (adjust as needed)
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX || '900', 10),
  standardHeaders: true,
  legacyHeaders: false,
}));

const path = require('path');
const { protect } = require('./middleware/auth');
const { PaymentRequest } = require('./models/Wallet');

// Request body size limits
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Deep NoSQL query injection sanitization middleware
const sanitizeNoSql = (obj) => {
  if (!obj || typeof obj !== 'object') return;
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
    } else if (typeof obj[key] === 'object') {
      sanitizeNoSql(obj[key]);
    }
  }
};

app.use((req, res, next) => {
  if (req.body) sanitizeNoSql(req.body);
  if (req.query) sanitizeNoSql(req.query);
  if (req.params) sanitizeNoSql(req.params);
  next();
});

// Protect confidential payment slips from direct unauthenticated public access
app.use('/uploads/payment-slips', (req, res, next) => {
  protect(req, res, async () => {
    try {
      const filename = path.basename(req.path);
      if (req.user && req.user.role === 'admin') {
        return res.sendFile(path.join(__dirname, 'uploads/payment-slips', filename));
      }
      const isOwner = req.user && (await PaymentRequest.exists({
        user: req.user._id,
        slipImageUrl: { $regex: filename }
      }));
      if (isOwner) {
        return res.sendFile(path.join(__dirname, 'uploads/payment-slips', filename));
      }
      return res.status(403).json({ message: 'Access denied to this payment slip' });
    } catch (err) {
      return res.status(500).json({ message: 'Error accessing payment slip' });
    }
  });
});

// Serve public uploads static directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Maintenance Mode Guard (Evaluates full-site or feature-specific maintenance with admin bypass)
const { maintenanceMiddleware } = require('./middleware/maintenanceMiddleware');
app.use(maintenanceMiddleware);

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/maintenance', require('./routes/maintenanceRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/premium', require('./routes/premiumRoutes'));
app.use('/api/gifts', require('./routes/giftRoutes'));
app.use('/api/achievements', require('./routes/achievementRoutes'));
app.use('/api/referrals', require('./routes/referralRoutes'));
app.use('/api/success-stories', require('./routes/successStoryRoutes'));
app.use('/api/blog', require('./routes/blogRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/typing', require('./routes/typingRoutes'));
app.use('/api/wallet', require('./routes/walletRoutes'));
app.use('/api/redemption', require('./routes/redemptionRoutes'));
app.use('/api/support', require('./routes/supportRoutes'));

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Matrimonial API is running',
    version: '2.0.0',
    database: dbConnected ? 'connected' : 'disconnected'
  });
});

// Fast health check for Render container monitoring (must respond immediately)
app.get('/health', (req, res) => {
  const brevoConfigured = Boolean(process.env.BREVO_API_KEY && String(process.env.BREVO_API_KEY).trim().length >= 8);

  res.status(200).json({ 
    status: 'ok',
    database: dbConnected ? 'connected' : 'disconnected',
    provider: 'brevo',
    emailConfigured: brevoConfigured,
    emailSender: process.env.EMAIL_FROM || process.env.EMAIL_FROM_ADDRESS || 'kapulk.support@gmail.com',
  });
});

// Deep email & HTTPS diagnostics (on demand)
app.get('/health/diagnostics', async (req, res) => {
  const { verifyConnection, getLastDeliveryStatus } = require('./services/emailService');
  let connectionStatus = null;
  try {
    connectionStatus = await verifyConnection();
  } catch (err) {
    connectionStatus = { success: false, error: err.message };
  }

  res.status(200).json({ 
    status: 'ok',
    database: dbConnected ? 'connected' : 'disconnected',
    provider: 'brevo',
    emailConfigured: Boolean(process.env.BREVO_API_KEY),
    emailSender: process.env.EMAIL_FROM || process.env.EMAIL_FROM_ADDRESS || 'kapulk.support@gmail.com',
    connectionStatus,
    lastDelivery: getLastDeliveryStatus ? getLastDeliveryStatus() : null,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler (sanitized in production to prevent leaking internals)
app.use((err, req, res, next) => {
  const isProd = process.env.NODE_ENV === 'production';
  // If another handler already started sending a response, do not try to write again.
  // This protects handlers that issue `res.status().json()` then throw later.
  if (res.headersSent) {
    console.error('[errorHandler] headers already sent, suppressing response.  Original error:', err && err.message ? err.message : err);
    try { next(err); } catch (_n) { /* noop */ }
    return;
  }

  if (!isProd) {
    console.error(err && err.stack ? err.stack : err);
  } else {
    console.error('API Error:', err && err.message ? err.message : err);
  }
  const statusCode = (err && (err.statusCode || err.status)) ? (err.statusCode || err.status) : 500;
  const clientMessage = isProd && statusCode === 500
    ? 'Internal Server Error'
    : (err && err.message ? err.message : 'Server Error');

  try {
    res.status(statusCode).json({
      message: clientMessage,
      ...(isProd ? {} : { stack: err && err.stack ? err.stack : undefined }),
    });
  } catch (sendErr) {
    console.error('[errorHandler] Failed to even write JSON response:', sendErr && sendErr.message ? sendErr.message : sendErr);
    try { res.end(); } catch (_e) { /* nothing more we can do */ }
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  // Initialize inactivity monitoring and permanent cascade cleanup scheduler
  try {
    const { startInactivityScheduler } = require('./services/inactivityCleanupService');
    startInactivityScheduler(3600000); // Hourly checks
  } catch (e) {
    console.warn('Failed to start inactivity scheduler:', e.message);
  }
});
