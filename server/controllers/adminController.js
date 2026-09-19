const User = require('../models/User');
const Message = require('../models/Message');
const PremiumPaymentRequest = require('../models/PremiumPaymentRequest');
const Event = require('../models/Event');
const Blog = require('../models/Blog');
const SuccessStory = require('../models/SuccessStory');
const Report = require('../models/Report');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');
const { logAuditEvent } = require('../middleware/auditLogger');

// @desc    Get all users (admin)
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve user
// @route   PUT /api/admin/users/:id/approve
// @access  Private/Admin
exports.approveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isApproved = true;
    await user.save();

    logAuditEvent({
      userId: req.user ? req.user._id : null,
      action: 'ADMIN_APPROVE_USER',
      targetId: user._id,
      targetType: 'User',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ message: 'User approved successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Manually verify user email
// @route   PUT /api/admin/users/:id/verify-email
// @access  Private/Admin
exports.verifyUserEmail = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.emailVerified = true;
    user.isEmailVerified = true;
    user.emailVerifiedAt = new Date();
    user.emailVerificationCode = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    logAuditEvent({
      userId: req.user ? req.user._id : null,
      action: 'ADMIN_VERIFY_EMAIL',
      targetId: user._id,
      targetType: 'User',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ message: 'User email verified successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject/Unapprove user
// @route   PUT /api/admin/users/:id/reject
// @access  Private/Admin
exports.rejectUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isApproved = false;
    await user.save();

    logAuditEvent({
      userId: req.user ? req.user._id : null,
      action: 'ADMIN_REJECT_USER',
      targetId: user._id,
      targetType: 'User',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ message: 'User approval revoked', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot delete admin user' });
    }

    await user.deleteOne();

    logAuditEvent({
      userId: req.user ? req.user._id : null,
      action: 'ADMIN_DELETE_USER',
      targetId: user._id,
      targetType: 'User',
      severity: 'warning',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    await user.save();

    logAuditEvent({
      userId: req.user ? req.user._id : null,
      action: 'ADMIN_UPDATE_ROLE',
      targetId: user._id,
      targetType: 'User',
      details: { role },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ message: 'User role updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle user active status
// @route   PUT /api/admin/users/:id/toggle-active
// @access  Private/Admin
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = !user.isActive;
    if (!user.isActive) {
      // Invalidate active sessions immediately when deactivated
      user.tokenVersion = (user.tokenVersion || 0) + 1;
    }
    await user.save();

    logAuditEvent({
      userId: req.user ? req.user._id : null,
      action: 'ADMIN_TOGGLE_USER_STATUS',
      targetId: user._id,
      targetType: 'User',
      details: { isActive: user.isActive },
      severity: user.isActive ? 'info' : 'warning',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ 
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`, 
      user 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle or update user premium plan tier
// @route   PUT /api/admin/users/:id/toggle-premium
// @access  Private/Admin
exports.togglePremiumStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { plan, durationDays } = req.body || {};

    if (plan) {
      if (plan === 'none' || plan === 'free' || plan === 'remove') {
        user.isPremium = false;
        user.premiumPlan = null;
        user.premiumExpiresAt = undefined;
        user.premiumSince = undefined;
      } else {
        user.isPremium = true;
        user.premiumPlan = plan; // 'bronze', 'silver', 'gold'
        user.premiumSince = new Date();
        const days = durationDays ? parseInt(durationDays, 10) : (plan === 'gold' ? 28 : plan === 'silver' ? 14 : 7);
        const expires = new Date();
        expires.setDate(expires.getDate() + days);
        user.premiumExpiresAt = expires;
      }
    } else {
      user.isPremium = !user.isPremium;
      if (user.isPremium) {
        user.premiumPlan = user.premiumPlan || 'gold';
        user.premiumSince = new Date();
        const expires = new Date();
        expires.setDate(expires.getDate() + 28);
        user.premiumExpiresAt = expires;
      } else {
        user.premiumPlan = null;
        user.premiumExpiresAt = undefined;
        user.premiumSince = undefined;
      }
    }

    user.premiumRequested = false;
    await user.save();

    res.json({ 
      message: `User premium status updated successfully`, 
      user 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({});
    const approvedUsers = await User.countDocuments({ isApproved: true });
    const pendingUsers = await User.countDocuments({ isApproved: false });
    const activeUsers = await User.countDocuments({ isActive: true });
    const onlineUsers = await User.countDocuments({ isOnline: true });
    const premiumUsers = await User.countDocuments({ isPremium: true });
    const maleUsers = await User.countDocuments({ gender: 'male' });
    const femaleUsers = await User.countDocuments({ gender: 'female' });
    const premiumRequests = await PremiumPaymentRequest.countDocuments({ status: 'pending' });
    const totalMessages = await Message.countDocuments({});
    const complaintsAgg = await User.aggregate([
      { $group: { _id: null, total: { $sum: { $ifNull: ['$complaints', 0] } } } }
    ]);
    const totalComplaints = (complaintsAgg[0] && complaintsAgg[0].total) || 0;

    // Get monthly registrations for last 6 months
    const now = new Date();
    const sixMonthsAgo = new Date(now.setMonth(now.getMonth() - 6));
    const monthlyRegistrations = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    res.json({
      totalUsers,
      approvedUsers,
      pendingUsers,
      activeUsers,
      onlineUsers,
      premiumUsers,
      maleUsers,
      femaleUsers,
      premiumRequests,
      totalMessages,
      totalComplaints,
      monthlyRegistrations,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create admin user (bootstrap)
// @route   POST /api/admin/create-admin
// @access  Public with Bootstrap Key
exports.createAdmin = async (req, res) => {
  try {
    const bootstrapKey = req.headers['x-admin-bootstrap-key'] || req.body.bootstrapKey;
    const requiredKey = process.env.ADMIN_BOOTSTRAP_KEY;

    if (!requiredKey || bootstrapKey !== requiredKey) {
      logAuditEvent({
        action: 'ADMIN_BOOTSTRAP_UNAUTHORIZED_ATTEMPT',
        severity: 'critical',
        details: { attemptedEmail: req.body.email },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      return res.status(403).json({
        message: 'Admin creation is restricted. Valid X-Admin-Bootstrap-Key required.',
      });
    }

    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    const password = req.body.password || process.env.ADMIN_PASSWORD;
    if (!password || (password === 'admin123' && process.env.NODE_ENV === 'production')) {
      return res.status(400).json({ message: 'A secure password is required to bootstrap the admin.' });
    }

    const admin = await User.create({
      name: req.body.name || 'Admin',
      username: req.body.username || 'admin',
      email: (req.body.email || process.env.ADMIN_EMAIL || 'admin@matrimony.com').toLowerCase().trim(),
      password,
      role: 'admin',
      isApproved: true,
      isActive: true,
    });

    logAuditEvent({
      userId: admin._id,
      action: 'ADMIN_BOOTSTRAP_SUCCESS',
      targetId: admin._id,
      targetType: 'User',
      severity: 'critical',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({
      message: 'Admin created successfully',
      email: admin.email,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete premium request
// @route   DELETE /api/admin/premium-requests/:id
// @access  Private/Admin
exports.deletePremiumRequest = async (req, res) => {
  try {
    const request = await PremiumPaymentRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Premium request not found' });
    }

    await PremiumPaymentRequest.findByIdAndDelete(req.params.id);

    res.json({ message: 'Premium request deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Seed Sri Lankan content (events, blogs, success stories)
// @route   POST /api/admin/seed-sri-lankan-content
// @access  Private/Admin
exports.seedSriLankanContent = async (req, res) => {
  try {
    const allowSeed = process.env.ENABLE_SEEDER === 'true' || process.env.NODE_ENV !== 'production';
    if (!allowSeed) {
      return res.status(403).json({
        message: 'Seeder is disabled. Set ENABLE_SEEDER=true (and redeploy) to allow seeding.',
      });
    }

    const adminUser = req.user._id;

    // Get some regular users for success stories
    const users = await User.find({ role: mongoose.trusted({ $ne: 'admin' }) }).limit(10);
    
    // Clear existing content
    await Event.deleteMany({});
    await Blog.deleteMany({});
    await SuccessStory.deleteMany({});

    // Sri Lankan Events
    const now = new Date();
    const addDays = (days) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const events = [
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
        startDate: addDays(7),
        endDate: addDays(7.1),
        maxAttendees: 50,
        isFree: true,
        tags: ['singles', 'networking', 'colombo'],
        isPublished: true,
        isFeatured: true,
        organizer: adminUser
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
        startDate: addDays(14),
        endDate: addDays(14.1),
        maxAttendees: 30,
        isFree: true,
        tags: ['workshop', 'culture', 'dating', 'kandy'],
        isPublished: true,
        isFeatured: true,
        organizer: adminUser
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
        startDate: addDays(21),
        endDate: addDays(21.2),
        maxAttendees: 100,
        isFree: true,
        tags: ['beach', 'social', 'galle', 'outdoor'],
        isPublished: true,
        organizer: adminUser
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
        startDate: addDays(28),
        endDate: addDays(28.1),
        maxAttendees: 40,
        isFree: true,
        tags: ['matchmaking', 'tamil', 'culture', 'jaffna'],
        isPublished: true,
        isFeatured: true,
        organizer: adminUser
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
        startDate: addDays(35),
        endDate: addDays(35.1),
        maxAttendees: 200,
        isFree: true,
        tags: ['webinar', 'online', 'dating', 'tips'],
        isPublished: true,
        organizer: adminUser
      }
    ];

    // Sri Lankan Blogs
    const blogs = [
      {
        title: 'Modern Dating in Sri Lanka: Balancing Tradition and Love',
        slug: 'modern-dating-sri-lanka-tradition-love',
        content: 'Dating in Sri Lanka has evolved significantly over the years. While traditional arranged marriages still exist, many young Sri Lankans are embracing modern dating practices while respecting their cultural heritage.\n\nIn this blog, we explore how to navigate the dating scene in Sri Lanka, from understanding family expectations to finding the right balance between independence and tradition. Whether you\'re in Colombo, Kandy, or any other part of the island, the dating landscape is unique and exciting.\n\nKey tips for dating in Sri Lanka:\n- Be respectful of cultural and religious differences\n- Communication with family is important\n- Take time to understand each other\'s background\n- Enjoy the diverse dating spots across the island',
        category: 'dating',
        tags: ['dating', 'sri lanka', 'culture', 'relationships'],
        coverImage: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=800&h=400&fit=crop',
        readTime: '5 min read',
        isPublished: true,
        featured: true,
        author: adminUser
      },
      {
        title: 'Best First Date Ideas in Sri Lanka',
        slug: 'best-first-date-ideas-sri-lanka',
        content: 'Planning the perfect first date in Sri Lanka? We\'ve got you covered! From romantic beach sunsets in Galle to cultural experiences in Kandy, Sri Lanka offers incredible date locations.\n\nTop First Date Ideas:\n\n1. Sunset at Galle Fort - Walk along the historic walls and enjoy ocean views\n2. Tea plantation visit in Nuwara Eliya - Romantic and scenic\n3. Dinner at a Colombo rooftop restaurant - Modern and sophisticated\n4. Temple visit in Anuradhapura - Cultural and spiritual\n5. Beach picnic in Mirissa - Relaxed and casual\n\nRemember, the best first dates are those where you can talk and get to know each other. Choose a location that allows for good conversation!',
        category: 'dating',
        tags: ['first date', 'sri lanka', 'romantic', 'locations'],
        coverImage: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&h=400&fit=crop',
        readTime: '4 min read',
        isPublished: true,
        featured: true,
        author: adminUser
      },
      {
        title: 'Understanding Sri Lankan Wedding Traditions',
        slug: 'understanding-sri-lankan-wedding-traditions',
        content: 'Sri Lankan weddings are beautiful, colorful celebrations that blend various cultural traditions. Whether it\'s a Sinhalese Poruwa ceremony or a Tamil Thirumangalyam, understanding these traditions can help you appreciate your partner\'s culture better.\n\nSinhalese Wedding Traditions:\n- The Poruwa ceremony is the centerpiece\n- Traditional attire includes the Kandyan sari and Osariya\n- Auspicious times (Nekath) are carefully selected\n\nTamil Wedding Traditions:\n- Thirumangalyam (tying the thali) is sacred\n- Traditional music and dance performances\n- Elaborate feasts and celebrations\n\nUnderstanding these traditions shows respect and can strengthen your relationship.',
        category: 'wedding',
        tags: ['wedding', 'traditions', 'culture', 'sinhalese', 'tamil'],
        coverImage: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=800&h=400&fit=crop',
        readTime: '6 min read',
        isPublished: true,
        author: adminUser
      },
      {
        title: 'Long-Distance Relationships in Sri Lanka',
        slug: 'long-distance-relationships-sri-lanka',
        content: 'With many Sri Lankans working abroad or in different cities, long-distance relationships are common. Here\'s how to make them work:\n\nCommunication Tips:\n- Schedule regular video calls\n- Share daily updates and photos\n- Plan visits in advance\n- Trust and transparency are key\n\nMaking it Work:\n- Have clear expectations\n- Celebrate special occasions together virtually\n- Send care packages and gifts\n- Plan for the future together\n\nTechnology has made long-distance relationships easier. Use apps like WhatsApp, Viber, and Zoom to stay connected.',
        category: 'relationships',
        tags: ['long distance', 'relationships', 'communication', 'tips'],
        coverImage: 'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=800&h=400&fit=crop',
        readTime: '5 min read',
        isPublished: true,
        author: adminUser
      },
      {
        title: 'Sri Lankan Food: Perfect for Dating',
        slug: 'sri-lankan-food-perfect-dating',
        content: 'Food is a universal language of love, and Sri Lankan cuisine offers incredible options for romantic dining. From spicy curries to sweet desserts, sharing a meal is a great way to bond.\n\nRomantic Sri Lankan Dishes to Try:\n- Rice and Curry - The ultimate sharing experience\n- Kottu - Fun and casual street food\n- String Hoppers with Pol Sambol - Traditional breakfast\n- Wattalapam - Sweet dessert for two\n- Seafood - Fresh from our beautiful coasts\n\nBest Places for Food Dates:\n- Ministry of Crab (Colombo)\n- The Gallery Café (Colombo)\n- Helga\'s Folly (Kandy)\n- A Minute by Tuk Tuk (Galle)\n\nFood brings people together - enjoy the culinary journey together!',
        category: 'lifestyle',
        tags: ['food', 'dating', 'sri lankan cuisine', 'restaurants'],
        coverImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=400&fit=crop',
        readTime: '4 min read',
        isPublished: true,
        featured: true,
        author: adminUser
      }
    ];

    // Sri Lankan Success Stories
    const successStories = [
      {
        coupleName: 'Nimal & Deepa',
        story: 'We met on Kapu LK in early 2024. What started as a simple message about our shared love for Sri Lankan cricket turned into daily conversations. After months of talking, we finally met at a café in Colombo. The chemistry was instant! We got engaged in December 2024 and are planning our wedding for August 2025. This platform truly helped us find our perfect match.',
        howWeMet: 'We bonded over our love for cricket and Kandy.',
        weddingDate: '2025-08-15',
        advice: 'Be patient and take time to really get to know each other. The right person is worth the wait!',
        photos: ['https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop'],
        isFeatured: true
      },
      {
        coupleName: 'Raj & Priya',
        story: 'Living in different cities (Colombo and Jaffna) made it challenging to meet, but Kapu LK brought us together. We spent months video calling and learning about each other\'s cultures. When we finally met in person, it was like we had known each other for years. We overcame the distance and cultural differences, and now we\'re happily married!',
        howWeMet: 'Distance was no barrier when we found each other online.',
        weddingDate: '2024-12-20',
        advice: 'Don\'t let distance or cultural differences stop you. Love transcends all boundaries.',
        photos: ['https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800&h=600&fit=crop'],
        isFeatured: true
      },
      {
        coupleName: 'Kasun & Nadee',
        story: 'Both of us were skeptical about online dating, but we decided to give Kapu LK a try. We connected over our shared interest in hiking and Sri Lankan nature. Our first date was a hike in Ella, and we\'ve been inseparable since. We got married in a beautiful ceremony in Kandy surrounded by family and friends.',
        howWeMet: 'A shared love for nature brought us together on the trails of Ella.',
        weddingDate: '2024-11-10',
        advice: 'Be open to new experiences. You never know where you might find love!',
        photos: ['https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800&h=600&fit=crop'],
        isFeatured: true
      },
      {
        coupleName: 'Suresh & Fathima',
        story: 'Coming from different religious backgrounds, we weren\'t sure if our families would approve. But we took a chance on Kapu LK, and it was the best decision we ever made. We took time to understand and respect each other\'s traditions. Our families eventually came around, and we had a beautiful interfaith wedding that celebrated both our cultures.',
        howWeMet: 'Love knows no religious boundaries when hearts connect.',
        weddingDate: '2025-01-25',
        advice: 'Respect and understanding are key to any relationship, especially across different backgrounds.',
        photos: ['https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&h=600&fit=crop'],
        isFeatured: true
      },
      {
        coupleName: 'Tharindu & Dilini',
        story: 'We were both busy professionals in Colombo with little time for socializing. Kapu LK helped us find each other despite our hectic schedules. We started with coffee breaks between work, which turned into dinner dates, weekend getaways, and eventually a lifetime together. We proved that even busy people can find love!',
        howWeMet: 'Coffee breaks between busy work schedules led to a lifetime of love.',
        weddingDate: '2024-10-05',
        advice: 'Make time for what matters. Even busy schedules can\'t stop true love.',
        photos: ['https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&h=400&fit=crop'],
        isFeatured: true
      }
    ];

    // Seed Events
    const createdEvents = await Event.insertMany(events);

    // Seed Blogs
    const createdBlogs = await Blog.insertMany(blogs);

    // Seed Success Stories with actual users or admin as fallback
    let createdStories = 0;
    for (let i = 0; i < successStories.length; i++) {
      const storyData = { ...successStories[i] };
      
      // Use available users or admin as fallback
      if (users && users.length >= 2) {
        const u1 = users[(i * 2) % users.length];
        const u2 = users[(i * 2 + 1) % users.length];
        storyData.user1 = u1._id;
        storyData.user2 = u2._id;
      } else {
        // Use admin as both users if not enough regular users
        storyData.user1 = adminUser;
        storyData.user2 = adminUser;
      }
      
      storyData.submittedBy = adminUser;
      storyData.isApproved = true;
      
      await SuccessStory.create(storyData);
      createdStories++;
    }

    res.json({
      message: '✅ Sri Lankan content seeded successfully!',
      events: createdEvents.length,
      blogs: createdBlogs.length,
      successStories: createdStories
    });
  } catch (error) {
    console.error('Error seeding Sri Lankan content:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get inactivity lifecycle status & counts
// @route   GET /api/admin/inactivity/status
// @access  Private/Admin
exports.getInactivityStatus = async (req, res) => {
  try {
    const { getInactivityStatus } = require('../services/inactivityCleanupService');
    const status = await getInactivityStatus();
    res.json({ success: true, ...status });
  } catch (error) {
    console.error('Error getting inactivity status:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch inactivity status' });
  }
};

// @desc    Manually trigger inactivity warning checks & permanent cascade purge
// @route   POST /api/admin/inactivity/run-cleanup
// @access  Private/Admin
exports.triggerInactivityCleanup = async (req, res) => {
  try {
    const { runInactivityChecks } = require('../services/inactivityCleanupService');
    const result = await runInactivityChecks();

    logAuditEvent({
      userId: req.user._id,
      action: 'ADMIN_TRIGGERED_INACTIVITY_CLEANUP',
      targetId: req.user._id,
      targetType: 'Admin',
      details: result,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      message: 'Inactivity cleanup cycle executed successfully',
      result,
    });
  } catch (error) {
    console.error('Error triggering inactivity cleanup:', error);
    res.status(500).json({ message: error.message || 'Failed to execute cleanup' });
  }
};

// @desc    Cancel pending inactivity deletion for a specific user (admin override)
// @route   POST /api/admin/inactivity/cancel/:userId
// @access  Private/Admin
exports.cancelUserInactivityDeletion = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.lastActiveAt = new Date();
    user.inactivityWarningsSent = { d5: false, d2: false, d1: false };
    await user.save();

    logAuditEvent({
      userId: req.user._id,
      action: 'ADMIN_CANCELED_INACTIVITY_DELETION',
      targetId: user._id,
      targetType: 'User',
      details: { email: user.email, name: user.name },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      message: `Inactivity deletion canceled for user ${user.name}. Countdown reset.`,
      user: { _id: user._id, name: user.name, lastActiveAt: user.lastActiveAt },
    });
  } catch (error) {
    console.error('Error canceling user inactivity deletion:', error);
    res.status(500).json({ message: error.message || 'Failed to cancel deletion' });
  }
};

// @desc    Get all user reports/complaints (Admin)
// @route   GET /api/admin/reports
// @access  Private/Admin
exports.getAllReports = async (req, res) => {
  try {
    const reports = await Report.find({})
      .populate('reporter', 'name email profileImageUrl phoneNumber gender age')
      .populate('reportedUser', 'name email profileImageUrl phoneNumber accountStatus isApproved gender age')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch reports' });
  }
};

// @desc    Update report status / resolve complaint (Admin)
// @route   PUT /api/admin/reports/:id
// @access  Private/Admin
exports.updateReportStatus = async (req, res) => {
  try {
    const { status, resolutionNotes, action } = req.body;
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (status) report.status = status;
    if (resolutionNotes !== undefined) report.resolutionNotes = resolutionNotes;
    report.reviewedBy = req.user._id;

    // Optional admin action on reported user
    if (action === 'suspend_user' && report.reportedUser) {
      await User.findByIdAndUpdate(report.reportedUser, { accountStatus: 'suspended' });
    }

    await report.save();

    logAuditEvent({
      userId: req.user._id,
      action: 'ADMIN_REPORT_RESOLVED',
      targetId: report._id,
      targetType: 'Report',
      details: { status: report.status, action },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    const updated = await Report.findById(report._id)
      .populate('reporter', 'name email profileImageUrl')
      .populate('reportedUser', 'name email profileImageUrl accountStatus')
      .populate('reviewedBy', 'name email');

    res.json({
      success: true,
      message: 'Report status updated successfully',
      report: updated,
    });
  } catch (error) {
    console.error('Error updating report status:', error);
    res.status(500).json({ message: error.message || 'Failed to update report' });
  }
};

// @desc    Delete a report (Admin)
// @route   DELETE /api/admin/reports/:id
// @access  Private/Admin
exports.deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    await Report.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ message: error.message || 'Failed to delete report' });
  }
};

// @desc    Start Maintenance Testing Mode (Switches session to secure demo account)
// @route   POST /api/admin/maintenance/start-testing
// @access  Private/Admin
exports.startMaintenanceTesting = async (req, res) => {
  try {
    // Find or create dedicated hidden demo maintenance testing user
    let demoUser = await User.findOne({ email: 'demo.tester@lovelk.com' });
    if (!demoUser) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('MaintTester#2026!SecureKey', salt);
      demoUser = await User.create({
        name: 'LoveLK Maintenance Tester',
        email: 'demo.tester@lovelk.com',
        password: hashedPassword,
        gender: 'female',
        age: 26,
        location: 'Colombo',
        role: 'user',
        isApproved: true,
        emailVerified: true,
        isDemoAccount: true,
        bio: 'Official LoveLK Maintenance Preview & Verification Account.',
      });
    } else if (!demoUser.isDemoAccount) {
      demoUser.isDemoAccount = true;
      await demoUser.save();
    }

    const token = generateToken(demoUser._id);

    logAuditEvent({
      userId: req.user._id,
      action: 'ADMIN_MAINTENANCE_TEST_STARTED',
      targetId: demoUser._id,
      targetType: 'User',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      message: 'Switched to Maintenance Testing Mode',
      token,
      user: {
        _id: demoUser._id,
        name: demoUser.name,
        email: demoUser.email,
        role: demoUser.role,
        isDemoAccount: true,
        isMaintenanceTesting: true,
        originalAdminId: req.user._id,
      },
    });
  } catch (error) {
    console.error('Error starting maintenance test mode:', error);
    res.status(500).json({ message: error.message || 'Failed to enter maintenance test mode' });
  }
};

// @desc    Stop Maintenance Testing Mode (Returns to Admin session)
// @route   POST /api/admin/maintenance/stop-testing
// @access  Private/Admin (or authenticated tester)
exports.stopMaintenanceTesting = async (req, res) => {
  try {
    // Find an active admin user or the requesting user's original admin account
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      return res.status(404).json({ message: 'Admin account not found' });
    }

    const token = generateToken(adminUser._id);

    res.json({
      success: true,
      message: 'Returned to Admin session successfully',
      token,
      user: {
        _id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
      },
    });
  } catch (error) {
    console.error('Error stopping maintenance test mode:', error);
    res.status(500).json({ message: error.message || 'Failed to exit maintenance test mode' });
  }
};

