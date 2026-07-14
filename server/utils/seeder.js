const User = require('../models/User');

const seedUsers = async () => {
  try {
    // Check for admin
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      await User.create({
        name: 'System Admin',
        username: 'admin',
        email: 'admin@matrimony.com',
        password: 'admin123', // Will be hashed by pre-save hook
        role: 'admin',
        isApproved: true,
        isActive: true,
      });
      console.log('✅ Default Admin Created: admin@matrimony.com / admin123');
    }

    // Check for default user
    const userExists = await User.findOne({ email: 'user@matrimony.com' });
    if (!userExists) {
      await User.create({
        name: 'Demo User',
        username: 'demouser',
        email: 'user@matrimony.com',
        password: 'user123', // Will be hashed by pre-save hook
        role: 'user',
        isApproved: true,
        isActive: true,
        gender: 'male',
        age: 30,
        bio: 'I am a demo user for testing purposes.',
        location: 'Colombo, Sri Lanka'
      });
      console.log('✅ Default User Created: user@matrimony.com / user123');
    }
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
  }
};

module.exports = seedUsers;
