const mongoose = require('mongoose');
const Event = require('../models/Event');
const Blog = require('../models/Blog');
const SuccessStory = require('../models/SuccessStory');
const User = require('../models/User');
require('dotenv').config();

const sriLankanEvents = [
  {
    title: 'Colombo Singles Meetup',
    description: 'Join us for an exciting evening of networking and socializing at the Colombo City Center. Meet like-minded singles in a relaxed and friendly atmosphere. Light refreshments will be served.',
    coverImage: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=400&fit=crop',
    eventType: 'meetup',
    location: {
      type: 'physical',
      address: 'Colombo City Center, Level 3',
      city: 'Colombo',
      country: 'Sri Lanka'
    },
    startDate: new Date('2026-10-15T18:00:00'),
    endDate: new Date('2026-10-15T21:00:00'),
    maxAttendees: 50,
    isFree: true,
    tags: ['singles', 'networking', 'colombo'],
    isPublished: true,
    isFeatured: true
  },
  {
    title: 'Kandy Cultural Dating Workshop',
    description: 'Learn about traditional Sri Lankan dating customs and how to navigate modern relationships while respecting cultural values. This workshop includes interactive sessions and expert advice.',
    coverImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop',
    eventType: 'workshop',
    location: {
      type: 'physical',
      address: 'Kandy City Centre, Conference Hall',
      city: 'Kandy',
      country: 'Sri Lanka'
    },
    startDate: new Date('2026-11-20T14:00:00'),
    endDate: new Date('2026-11-20T17:00:00'),
    maxAttendees: 30,
    isFree: true,
    tags: ['workshop', 'culture', 'dating', 'kandy'],
    isPublished: true,
    isFeatured: true
  },
  {
    title: 'Galle Beach Social Gathering',
    description: 'A fun-filled day at Galle Beach with games, music, and opportunities to meet new people. Perfect for those who love the beach and outdoor activities.',
    coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=400&fit=crop',
    eventType: 'party',
    location: {
      type: 'physical',
      address: 'Galle Beach Park',
      city: 'Galle',
      country: 'Sri Lanka'
    },
    startDate: new Date('2026-12-25T10:00:00'),
    endDate: new Date('2026-12-25T16:00:00'),
    maxAttendees: 100,
    isFree: true,
    tags: ['beach', 'social', 'galle', 'outdoor'],
    isPublished: true
  },
  {
    title: 'Jaffna Traditional Matchmaking Event',
    description: 'Experience traditional Tamil matchmaking with a modern twist. Parents and singles welcome to participate in this cultural event that honors tradition while embracing modern dating.',
    coverImage: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800&h=400&fit=crop',
    eventType: 'meetup',
    location: {
      type: 'physical',
      address: 'Jaffna Public Library Hall',
      city: 'Jaffna',
      country: 'Sri Lanka'
    },
    startDate: new Date('2027-01-15T15:00:00'),
    endDate: new Date('2027-01-15T19:00:00'),
    maxAttendees: 40,
    isFree: true,
    tags: ['matchmaking', 'tamil', 'culture', 'jaffna'],
    isPublished: true,
    isFeatured: true
  },
  {
    title: 'Online Sri Lankan Dating Webinar',
    description: 'Join our experts for an informative webinar about online dating in Sri Lanka. Learn safety tips, profile optimization, and how to make meaningful connections online.',
    coverImage: 'https://images.unsplash.com/photo-1593642532842-98d0fd772a90?w=800&h=400&fit=crop',
    eventType: 'webinar',
    location: {
      type: 'online',
      meetingLink: 'https://zoom.us/j/example123'
    },
    startDate: new Date('2027-02-14T19:00:00'),
    endDate: new Date('2027-02-14T20:30:00'),
    maxAttendees: 200,
    isFree: true,
    tags: ['webinar', 'online', 'dating', 'tips'],
    isPublished: true
  }
];

const sriLankanBlogs = [
  {
    title: 'Modern Dating in Sri Lanka: Balancing Tradition and Love',
    slug: 'modern-dating-sri-lanka-tradition-love',
    content: 'Dating in Sri Lanka has evolved significantly over the years. While traditional arranged marriages still exist, many young Sri Lankans are embracing modern dating practices while respecting their cultural heritage.\n\nIn this blog, we explore how to navigate the dating scene in Sri Lanka, from understanding family expectations to finding the right balance between independence and tradition. Whether you\'re in Colombo, Kandy, or any other part of the island, the dating landscape is unique and exciting.\n\nKey tips for dating in Sri Lanka:\n- Be respectful of cultural and religious differences\n- Communication with family is important\n- Take time to understand each other\'s background\n- Enjoy the diverse dating spots across the island',
    category: 'dating',
    tags: ['dating', 'sri lanka', 'culture', 'relationships'],
    featuredImage: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=800&h=400&fit=crop',
    readTime: '5 min read',
    isPublished: true,
    featured: true
  },
  {
    title: 'Best First Date Ideas in Sri Lanka',
    slug: 'best-first-date-ideas-sri-lanka',
    content: 'Planning the perfect first date in Sri Lanka? We\'ve got you covered! From romantic beach sunsets in Galle to cultural experiences in Kandy, Sri Lanka offers incredible date locations.\n\nTop First Date Ideas:\n\n1. Sunset at Galle Fort - Walk along the historic walls and enjoy ocean views\n2. Tea plantation visit in Nuwara Eliya - Romantic and scenic\n3. Dinner at a Colombo rooftop restaurant - Modern and sophisticated\n4. Temple visit in Anuradhapura - Cultural and spiritual\n5. Beach picnic in Mirissa - Relaxed and casual\n\nRemember, the best first dates are those where you can talk and get to know each other. Choose a location that allows for good conversation!',
    category: 'dating',
    tags: ['first date', 'sri lanka', 'romantic', 'locations'],
    featuredImage: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&h=400&fit=crop',
    readTime: '4 min read',
    isPublished: true,
    featured: true
  },
  {
    title: 'Understanding Sri Lankan Wedding Traditions',
    slug: 'understanding-sri-lankan-wedding-traditions',
    content: 'Sri Lankan weddings are beautiful, colorful celebrations that blend various cultural traditions. Whether it\'s a Sinhalese Poruwa ceremony or a Tamil Thirumangalyam, understanding these traditions can help you appreciate your partner\'s culture better.\n\nSinhalese Wedding Traditions:\n- The Poruwa ceremony is the centerpiece\n- Traditional attire includes the Kandyan sari and Osariya\n- Auspicious times (Nekath) are carefully selected\n\nTamil Wedding Traditions:\n- Thirumangalyam (tying the thali) is sacred\n- Traditional music and dance performances\n- Elaborate feasts and celebrations\n\nUnderstanding these traditions shows respect and can strengthen your relationship.',
    category: 'wedding',
    tags: ['wedding', 'traditions', 'culture', 'sinhalese', 'tamil'],
    featuredImage: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=800&h=400&fit=crop',
    readTime: '6 min read',
    isPublished: true
  },
  {
    title: 'Long-Distance Relationships in Sri Lanka',
    slug: 'long-distance-relationships-sri-lanka',
    content: 'With many Sri Lankans working abroad or in different cities, long-distance relationships are common. Here\'s how to make them work:\n\nCommunication Tips:\n- Schedule regular video calls\n- Share daily updates and photos\n- Plan visits in advance\n- Trust and transparency are key\n\nMaking it Work:\n- Have clear expectations\n- Celebrate special occasions together virtually\n- Send care packages and gifts\n- Plan for the future together\n\nTechnology has made long-distance relationships easier. Use apps like WhatsApp, Viber, and Zoom to stay connected.',
    category: 'relationships',
    tags: ['long distance', 'relationships', 'communication', 'tips'],
    featuredImage: 'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=800&h=400&fit=crop',
    readTime: '5 min read',
    isPublished: true
  },
  {
    title: 'Sri Lankan Food: Perfect for Dating',
    slug: 'sri-lankan-food-perfect-dating',
    content: 'Food is a universal language of love, and Sri Lankan cuisine offers incredible options for romantic dining. From spicy curries to sweet desserts, sharing a meal is a great way to bond.\n\nRomantic Sri Lankan Dishes to Try:\n- Rice and Curry - The ultimate sharing experience\n- Kottu - Fun and casual street food\n- String Hoppers with Pol Sambol - Traditional breakfast\n- Wattalapam - Sweet dessert for two\n- Seafood - Fresh from our beautiful coasts\n\nBest Places for Food Dates:\n- Ministry of Crab (Colombo)\n- The Gallery Café (Colombo)\n- Helga\'s Folly (Kandy)\n- A Minute by Tuk Tuk (Galle)\n\nFood brings people together - enjoy the culinary journey together!',
    category: 'lifestyle',
    tags: ['food', 'dating', 'sri lankan cuisine', 'restaurants'],
    featuredImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=400&fit=crop',
    readTime: '4 min read',
    isPublished: true,
    featured: true
  }
];

const sriLankanSuccessStories = [
  {
    coupleName: 'Nimal & Deepa',
    story: 'We met on Kapu LK in early 2024. What started as a simple message about our shared love for Sri Lankan cricket turned into daily conversations. After months of talking, we finally met at a café in Colombo. The chemistry was instant! We got engaged in December 2024 and are planning our wedding for August 2025. This platform truly helped us find our perfect match.',
    howWeMet: 'We bonded over our love for cricket and Kandy.',
    weddingDate: '2025-08-15',
    advice: 'Be patient and take time to really get to know each other. The right person is worth the wait!',
    photos: ['https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop'],
    isFeatured: true,
    isPublished: true
  },
  {
    coupleName: 'Raj & Priya',
    story: 'Living in different cities (Colombo and Jaffna) made it challenging to meet, but Kapu LK brought us together. We spent months video calling and learning about each other\'s cultures. When we finally met in person, it was like we had known each other for years. We overcame the distance and cultural differences, and now we\'re happily married!',
    howWeMet: 'Distance was no barrier when we found each other online.',
    weddingDate: '2024-12-20',
    advice: 'Don\'t let distance or cultural differences stop you. Love transcends all boundaries.',
    photos: ['https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800&h=600&fit=crop'],
    isFeatured: true,
    isPublished: true
  },
  {
    coupleName: 'Kasun & Nadee',
    story: 'Both of us were skeptical about online dating, but we decided to give Kapu LK a try. We connected over our shared interest in hiking and Sri Lankan nature. Our first date was a hike in Ella, and we\'ve been inseparable since. We got married in a beautiful ceremony in Kandy surrounded by family and friends.',
    howWeMet: 'A shared love for nature brought us together on the trails of Ella.',
    weddingDate: '2024-11-10',
    advice: 'Be open to new experiences. You never know where you might find love!',
    photos: ['https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800&h=600&fit=crop'],
    isFeatured: true,
    isPublished: true
  },
  {
    coupleName: 'Suresh & Fathima',
    story: 'Coming from different religious backgrounds, we weren\'t sure if our families would approve. But we took a chance on Kapu LK, and it was the best decision we ever made. We took time to understand and respect each other\'s traditions. Our families eventually came around, and we had a beautiful interfaith wedding that celebrated both our cultures.',
    howWeMet: 'Love knows no religious boundaries when hearts connect.',
    weddingDate: '2025-01-25',
    advice: 'Respect and understanding are key to any relationship, especially across different backgrounds.',
    photos: ['https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&h=600&fit=crop'],
    isFeatured: true,
    isPublished: true
  },
  {
    coupleName: 'Tharindu & Dilini',
    story: 'We were both busy professionals in Colombo with little time for socializing. Kapu LK helped us find each other despite our hectic schedules. We started with coffee breaks between work, which turned into dinner dates, weekend getaways, and eventually a lifetime together. We proved that even busy people can find love!',
    howWeMet: 'Coffee breaks between busy work schedules led to a lifetime of love.',
    weddingDate: '2024-10-05',
    advice: 'Make time for what matters. Even busy schedules can\'t stop true love.',
    photos: ['https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&h=600&fit=crop'],
    isFeatured: true,
    isPublished: true
  }
];

const seedSriLankanContent = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Get admin user for organizer
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('No admin user found. Please create an admin user first.');
      process.exit(1);
    }

    // Get some regular users for success stories
    const users = await User.find({ role: { $ne: 'admin' } }).limit(10);
    if (users.length < 2) {
      console.log('Not enough users found for success stories. Please create more users first.');
      process.exit(1);
    }

    // Clear existing content
    await Event.deleteMany({});
    await Blog.deleteMany({});
    await SuccessStory.deleteMany({});
    console.log('Cleared existing events, blogs, and success stories');

    // Seed Events
    for (const eventData of sriLankanEvents) {
      eventData.organizer = adminUser._id;
      const event = new Event(eventData);
      await event.save();
      console.log(`Created event: ${event.title}`);
    }

    // Seed Blogs
    for (const blogData of sriLankanBlogs) {
      blogData.author = adminUser._id;
      const blog = new Blog(blogData);
      await blog.save();
      console.log(`Created blog: ${blog.title}`);
    }

    // Seed Success Stories with actual users
    for (let i = 0; i < sriLankanSuccessStories.length; i++) {
      const storyData = sriLankanSuccessStories[i];
      // Use pairs of users for couples
      const user1 = users[i * 2];
      const user2 = users[i * 2 + 1] || users[0]; // Fallback to first user if not enough
      
      storyData.user1 = user1._id;
      storyData.user2 = user2._id;
      storyData.submittedBy = adminUser._id;
      
      const story = new SuccessStory(storyData);
      await story.save();
      console.log(`Created success story: ${story.coupleName}`);
    }

    console.log('\n✅ Sri Lankan content seeded successfully!');
    console.log(`- ${sriLankanEvents.length} events created`);
    console.log(`- ${sriLankanBlogs.length} blog posts created`);
    console.log(`- ${sriLankanSuccessStories.length} success stories created`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding Sri Lankan content:', error);
    process.exit(1);
  }
};

seedSriLankanContent();
