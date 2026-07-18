const User = require('../models/User');
const Message = require('../models/Message');
const PremiumPaymentRequest = require('../models/PremiumPaymentRequest');
const bcrypt = require('bcryptjs');

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

    res.json({ message: 'User approved successfully', user });
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
    await user.save();

    res.json({ 
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`, 
      user 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle user premium status
// @route   PUT /api/admin/users/:id/toggle-premium
// @access  Private/Admin
exports.togglePremiumStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isPremium = !user.isPremium;
    if (user.isPremium) {
      user.premiumSince = new Date();
    } else {
      user.premiumSince = undefined;
    }
    user.premiumRequested = false;
    await user.save();

    res.json({ 
      message: `User premium status ${user.isPremium ? 'enabled' : 'disabled'} successfully`, 
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

// @desc    Create admin user (run once)
// @route   POST /api/admin/create-admin
// @access  Public (should be protected in production)
exports.createAdmin = async (req, res) => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });

    if (adminExists) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    const admin = await User.create({
      name: 'Admin',
      username: 'admin',
      email: process.env.ADMIN_EMAIL || 'admin@matrimony.com',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      role: 'admin',
      isApproved: true,
      isActive: true,
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
