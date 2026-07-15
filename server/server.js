const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
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
    await seedUsers();
    startMessageCleanup();
  }
})();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
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

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Server Error' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
