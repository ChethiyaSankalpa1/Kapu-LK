const mongoose = require('mongoose');

let memoryServer;
let MongoMemoryServer;

// Only load mongodb-memory-server in development
if (process.env.NODE_ENV !== 'production') {
  try {
    const MMS = require('mongodb-memory-server');
    MongoMemoryServer = MMS.MongoMemoryServer || MMS;
  } catch (err) {
    console.warn('mongodb-memory-server not installed, skipping in-memory MongoDB fallback');
  }
}

const connectDB = async () => {
  try {
    // Security hardening (helps prevent operator injection patterns)
    mongoose.set('strictQuery', true);
    mongoose.set('sanitizeFilter', true);
    mongoose.set('autoIndex', process.env.NODE_ENV !== 'production');

    if (!process.env.MONGO_URI) {
      if (process.env.NODE_ENV === 'production') {
        console.warn('MongoDB not configured: missing MONGO_URI in environment');
        return false;
      }

      console.warn('MongoDB not configured: missing MONGO_URI. Using in-memory MongoDB for development.');
      if (MongoMemoryServer) {
        try {
          memoryServer = await MongoMemoryServer.create();
          const uri = memoryServer.getUri();
          const conn = await mongoose.connect(uri);
          console.log(`MongoDB Connected: ${conn.connection.host}`);
          return true;
        } catch (fallbackError) {
          console.error(`Fallback in-memory MongoDB error: ${fallbackError.message}`);
          return false;
        }
      } else {
        console.error('No MongoDB configuration available');
        return false;
      }
    }

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 75000,
      connectTimeoutMS: 30000,
      retryWrites: true,
      retryReads: true,
      maxPoolSize: 10,
      minPoolSize: 2
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });

  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    if (error.message.includes('ENOTFOUND') || error.message.includes('ETIMEDOUT')) {
      console.log('\n⚠️  IMPORTANT: Please check:');
      console.log('1. Your internet connection');
      console.log('2. MongoDB Atlas IP whitelist at https://cloud.mongodb.com');
      console.log('3. Your MongoDB connection string in .env file\n');
    }
    if (process.env.NODE_ENV !== 'production' && MongoMemoryServer) {
      try {
        memoryServer = await MongoMemoryServer.create();
        const uri = memoryServer.getUri();
        const conn = await mongoose.connect(uri);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
      } catch (fallbackError) {
        console.error(`Fallback in-memory MongoDB error: ${fallbackError.message}`);
        return false;
      }
    } else {
      return false;
    }
  }
  return true;
};

module.exports = connectDB;

