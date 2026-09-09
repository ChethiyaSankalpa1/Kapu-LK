const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { seedUsers, seedAchievements, seedGifts } = require('./utils/seeder');

const { startMessageCleanup } = require('./utils/messageCleanup');
const { startNotificationCleanup } = require('./utils/notificationCleanup');

// Load env vars
dotenv.config({ override: true });

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

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

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
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

// Health check for Render
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    database: dbConnected ? 'connected' : 'disconnected'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler (sanitized in production to prevent leaking internals)
app.use((err, req, res, next) => {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    console.error(err.stack);
  } else {
    console.error('API Error:', err.message);
  }
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: isProd && statusCode === 500 ? 'Internal Server Error' : err.message || 'Server Error',
    ...(isProd ? {} : { stack: err.stack }),
  });
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
