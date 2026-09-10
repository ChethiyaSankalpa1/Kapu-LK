const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function createTestInvalidUser() {
  try {
    // Use the same connection setup as the server
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/kapu-lk';
    
    // If no MONGO_URI, use in-memory MongoDB (same as server)
    if (!process.env.MONGO_URI) {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      await mongoose.connect(uri);
      console.log('✅ Connected to in-memory MongoDB\n');
    } else {
      await mongoose.connect(mongoUri);
      console.log('✅ Connected to database\n');
    }

    // Create a user with invalid email (simulating old data)
    const testUser = await User.create({
      name: 'Chethiya Sankalpa',
      email: 'chethiya//56//', // Invalid email format
      password: 'password123',
      age: 18,
      gender: 'male',
      emailVerified: false,
      agreedToTerms: true,
      acknowledgedPrivacyPolicyAt: new Date(),
      acknowledgedPrivacyPolicyVersion: '2.0',
    });

    console.log('✅ Test user created with invalid email:');
    console.log(`   ID: ${testUser._id}`);
    console.log(`   Name: ${testUser.name}`);
    console.log(`   Email: "${testUser.email}"`);
    console.log(`   Email Verified: ${testUser.emailVerified}\n`);

    console.log('Now you can run the migration script to repair this account:');
    console.log('node scripts/repairInvalidEmails.js repair "chethiya//56//" "chethiyasankalpa456@gmail.com"');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTestInvalidUser();