const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const seedUsers = require('./utils/seeder');
const { startMessageCleanup } = require('./utils/messageCleanup');

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

    if (allowSeed) {
      await seedUsers();
    }
    if (allowCleanup) {
      startMessageCleanup();
    }
  }
})();

const app = express();

app.set('trust proxy', 1);

// Middleware
// Security headers
app.use(helmet());

// Response compression
app.use(compression());

// CORS (restrict in production via CORS_ORIGIN="https://site.com,https://www.site.com")
const corsOriginEnv = process.env.CORS_ORIGIN;
const corsOrigins = corsOriginEnv
  ? corsOriginEnv.split(',').map((s) => s.trim()).filter(Boolean)
  : null;
app.use(cors({
  origin: corsOrigins || true,
  credentials: true,
}));

// Basic rate limiting (adjust as needed)
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX || '900', 10),
  standardHeaders: true,
  legacyHeaders: false,
}));

app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/premium', require('./routes/premiumRoutes'));

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Matrimonial API is running',
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

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({ message: err.message || 'Server Error' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
