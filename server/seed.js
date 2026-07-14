const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const demoUsers = [
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    age: 28,
    gender: 'male',
    bio: 'I love hiking and exploring new places! Looking for someone with a sense of adventure.',
    interests: 'Hiking, Travel, Photography',
    location: 'Colombo',
    education: 'BSc Computer Science',
    occupation: 'Software Engineer',
    religion: 'Buddhist',
    maritalStatus: 'single',
    profileImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=faces',
    isApproved: true,
    isActive: true,
    isPremium: false,
    language: 'en',
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'password123',
    age: 25,
    gender: 'female',
    bio: 'Coffee lover, bookworm, and aspiring chef. Let\'s grab a coffee sometime!',
    interests: 'Reading, Cooking, Yoga',
    location: 'Kandy',
    education: 'BA English Literature',
    occupation: 'Content Writer',
    religion: 'Christian',
    maritalStatus: 'single',
    profileImageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=faces',
    isApproved: true,
    isActive: true,
    isPremium: false,
    language: 'en',
  },
  {
    name: 'Ruwan Perera',
    email: 'ruwan@example.com',
    password: 'password123',
    age: 30,
    gender: 'male',
    bio: 'ජීවිතය වටින්න දැනුම් දෙන්න පුළුවන් අයෙක් සොයමින්.',
    interests: 'Music, Cricket, Movies',
    location: 'Galle',
    education: 'BCom',
    occupation: 'Accountant',
    religion: 'Buddhist',
    maritalStatus: 'single',
    profileImageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=faces',
    isApproved: true,
    isActive: true,
    isPremium: true,
    language: 'si',
  },
  {
    name: 'Priya Rajan',
    email: 'priya@example.com',
    password: 'password123',
    age: 27,
    gender: 'female',
    bio: 'கலையை நேசிப்பவர், நண்பர்களுடன் நேரம் செலவிடுபவர்.',
    interests: 'Dance, Art, Music',
    location: 'Jaffna',
    education: 'BFA Fine Arts',
    occupation: 'Graphic Designer',
    religion: 'Hindu',
    maritalStatus: 'single',
    profileImageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=faces',
    isApproved: true,
    isActive: true,
    isPremium: false,
    language: 'ta',
  },
  {
    name: 'David Johnson',
    email: 'david@example.com',
    password: 'password123',
    age: 32,
    gender: 'male',
    bio: 'Tech enthusiast, fitness fanatic, and foodie. Love trying new cuisines!',
    interests: 'Technology, Gym, Food',
    location: 'Negombo',
    education: 'MSc Engineering',
    occupation: 'Project Manager',
    religion: 'Christian',
    maritalStatus: 'single',
    profileImageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=faces',
    isApproved: true,
    isActive: true,
    isPremium: true,
    language: 'en',
  },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Hash passwords and insert users
    for (const userData of demoUsers) {
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(userData.password, salt);
      const user = new User(userData);
      await user.save();
    }

    console.log('Demo users inserted successfully!');
    console.log('You can log in with:');
    demoUsers.forEach(user => {
      console.log(`- Email: ${user.email}, Password: password123`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDB();
