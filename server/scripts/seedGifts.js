const mongoose = require('mongoose');
const { Gift } = require('../models/Gift');
const connectDB = require('../config/db');
require('dotenv').config();

const gifts = [
  {
    name: 'Red Rose',
    description: 'A beautiful red rose to express love',
    emoji: '🌹',
    category: 'flowers',
    price: 50,
    currency: 'LKR',
    isPremium: false,
    isRecommended: true,
    isActive: true,
    rarity: 'common'
  },
  {
    name: 'Heart Balloon',
    description: 'A heart-shaped balloon',
    emoji: '🎈',
    category: 'hearts',
    price: 30,
    currency: 'LKR',
    isPremium: false,
    isRecommended: false,
    isActive: true,
    rarity: 'common'
  },
  {
    name: 'Chocolate Box',
    description: 'A box of delicious chocolates',
    emoji: '🍫',
    category: 'food',
    price: 150,
    currency: 'LKR',
    isPremium: false,
    isRecommended: true,
    isActive: true,
    rarity: 'rare'
  },
  {
    name: 'Love Letter',
    description: 'A romantic love letter',
    emoji: '💌',
    category: 'gifts',
    price: 25,
    currency: 'LKR',
    isPremium: false,
    isRecommended: false,
    isActive: true,
    rarity: 'common'
  },
  {
    name: 'Diamond Ring',
    description: 'A sparkling diamond ring',
    emoji: '💍',
    category: 'special',
    price: 5000,
    currency: 'LKR',
    isPremium: true,
    isRecommended: true,
    isActive: true,
    rarity: 'legendary'
  },
  {
    name: 'Bouquet',
    description: 'A beautiful flower bouquet',
    emoji: '💐',
    category: 'flowers',
    price: 200,
    currency: 'LKR',
    isPremium: false,
    isRecommended: true,
    isActive: true,
    rarity: 'rare'
  },
  {
    name: 'Teddy Bear',
    description: 'A cute teddy bear',
    emoji: '🧸',
    category: 'gifts',
    price: 300,
    currency: 'LKR',
    isPremium: false,
    isRecommended: true,
    isActive: true,
    rarity: 'rare'
  },
  {
    name: 'Love Cake',
    description: 'A heart-shaped cake',
    emoji: '🎂',
    category: 'food',
    price: 250,
    currency: 'LKR',
    isPremium: false,
    isRecommended: false,
    isActive: true,
    rarity: 'rare'
  },
  {
    name: 'Champagne',
    description: 'A bottle of champagne',
    emoji: '🍾',
    category: 'drinks',
    price: 400,
    currency: 'LKR',
    isPremium: true,
    isRecommended: false,
    isActive: true,
    rarity: 'epic'
  },
  {
    name: 'Heart Pendant',
    description: 'A beautiful heart pendant',
    emoji: '💎',
    category: 'special',
    price: 1000,
    currency: 'LKR',
    isPremium: true,
    isRecommended: true,
    isActive: true,
    rarity: 'epic'
  },
  {
    name: 'Sunflower',
    description: 'A bright sunflower',
    emoji: '🌻',
    category: 'flowers',
    price: 75,
    currency: 'LKR',
    isPremium: false,
    isRecommended: false,
    isActive: true,
    rarity: 'common'
  },
  {
    name: 'Love Birds',
    description: 'Two love birds together',
    emoji: '🕊️',
    category: 'special',
    price: 150,
    currency: 'LKR',
    isPremium: false,
    isRecommended: true,
    isActive: true,
    rarity: 'rare'
  },
  {
    name: 'Cupcake',
    description: 'A sweet cupcake',
    emoji: '🧁',
    category: 'food',
    price: 40,
    currency: 'LKR',
    isPremium: false,
    isRecommended: false,
    isActive: true,
    rarity: 'common'
  },
  {
    name: 'Perfume',
    description: 'A luxurious perfume',
    emoji: '🌸',
    category: 'special',
    price: 800,
    currency: 'LKR',
    isPremium: true,
    isRecommended: true,
    isActive: true,
    rarity: 'epic'
  },
  {
    name: 'Love Lock',
    description: 'A padlock to seal your love',
    emoji: '🔒',
    category: 'special',
    price: 200,
    currency: 'LKR',
    isPremium: false,
    isRecommended: false,
    isActive: true,
    rarity: 'rare'
  },
  {
    name: 'Chocolate Strawberry',
    description: 'Chocolate covered strawberries',
    emoji: '🍓',
    category: 'food',
    price: 100,
    currency: 'LKR',
    isPremium: false,
    isRecommended: true,
    isActive: true,
    rarity: 'common'
  },
  {
    name: 'Rose Petals',
    description: 'Scattered rose petals',
    emoji: '🌹',
    category: 'flowers',
    price: 60,
    currency: 'LKR',
    isPremium: false,
    isRecommended: false,
    isActive: true,
    rarity: 'common'
  },
  {
    name: 'Crown',
    description: 'A royal crown for your king/queen',
    emoji: '👑',
    category: 'special',
    price: 3000,
    currency: 'LKR',
    isPremium: true,
    isRecommended: true,
    isActive: true,
    rarity: 'legendary'
  },
  {
    name: 'Star',
    description: 'A shining star',
    emoji: '⭐',
    category: 'special',
    price: 1500,
    currency: 'LKR',
    isPremium: true,
    isRecommended: true,
    isActive: true,
    rarity: 'epic'
  },
  {
    name: 'Gift Box',
    description: 'A mysterious gift box',
    emoji: '🎁',
    category: 'gifts',
    price: 500,
    currency: 'LKR',
    isPremium: false,
    isRecommended: true,
    isActive: true,
    rarity: 'rare'
  }
];

async function seedGifts() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Clear existing gifts
    await Gift.deleteMany({});
    console.log('Cleared existing gifts');

    // Insert new gifts
    const insertedGifts = await Gift.insertMany(gifts);
    console.log(`Successfully inserted ${insertedGifts.length} gifts`);

    console.log('Gifts seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding gifts:', error);
    process.exit(1);
  }
}

seedGifts();
