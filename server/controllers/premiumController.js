const mongoose = require('mongoose');
const User = require('../models/User');
const PremiumPaymentRequest = require('../models/PremiumPaymentRequest');
const PremiumPlan = require('../models/PremiumPlan');
const Notification = require('../models/Notification');
const { Wallet, WalletTransaction } = require('../models/Wallet');
const cloudinary = require('../config/cloudinary');
const { checkUserPremiumStatus } = require('../utils/premiumExpiryChecker');
const { logAuditEvent } = require('../middleware/auditLogger');
const { getUserPremiumDetails, PLAN_DURATIONS } = require('../utils/entitlements');

const isValidPhoneNumber = (value) => !value || /^[0-9]+$/.test(value);

const OFFICIAL_PLANS = [
  {
    name: 'Bronze Plan',
    badge: 'bronze',
    price: 500,
    currency: 'LKR',
    durationDays: 10,
    description: 'Essential 10-day premium pass for quick matching',
    features: ['10 Days Premium Access', 'Unlimited Messages', 'Profile Boost', 'Bronze Badge', 'Ad-Free Experience'],
    isPopular: false,
    isActive: true,
  },
  {
    name: 'Silver Plan',
    badge: 'silver',
    price: 1300,
    currency: 'LKR',
    durationDays: 21,
    description: 'Popular 21-day plan with priority matching',
    features: ['21 Days Premium Access', 'Unlimited Messages', 'Priority Matching', 'Direct Contact Info', 'Silver Badge', 'Profile Visitors List', 'Ad-Free Experience'],
    isPopular: true,
    isActive: true,
  },
  {
    name: 'Gold Plan',
    badge: 'gold',
    price: 3000,
    currency: 'LKR',
    durationDays: 60,
    description: 'Ultimate 60-day VIP pass for serious matchmaking',
    features: ['60 Days Premium Access', 'Unlimited Messages', 'Highest Priority Matching', 'Direct Contact Info', 'Gold Badge', 'VIP Profile Spotlight', 'Profile Visitors List', 'Ad-Free Experience', 'Priority Support'],
    isPopular: false,
    isActive: true,
  },
];

// @desc    Get all available premium plans
// @route   GET /api/premium/plans
// @access  Public / Private
exports.getPlans = async (req, res) => {
  try {
    // Ensure official plans are always up-to-date with consistent specifications
    for (const official of OFFICIAL_PLANS) {
      await PremiumPlan.findOneAndUpdate(
        { badge: official.badge },
        { $set: official },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    const plans = await PremiumPlan.find({ isActive: true }).sort({ price: 1 });
    res.json(plans);
  } catch (error) {
    console.error('Error fetching premium plans:', error);
    res.status(500).json({ message: 'Failed to fetch premium plans' });
  }
};

// @desc    Get all premium plans including inactive (admin only)
// @route   GET /api/premium/admin/plans
// @access  Private/Admin
exports.getAllPlansAdmin = async (req, res) => {
  try {
    const plans = await PremiumPlan.find({}).sort({ price: 1 });
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new premium plan (admin only)
// @route   POST /api/premium/admin/plans
// @access  Private/Admin
exports.createPlan = async (req, res) => {
  try {
    const plan = await PremiumPlan.create(req.body);
    res.status(201).json(plan);
  } catch (error) {
    console.error('Error creating plan:', error);
    res.status(500).json({ message: error.message || 'Failed to create plan' });
  }
};

// @desc    Update a premium plan (admin only)
// @route   PUT /api/premium/admin/plans/:id
// @access  Private/Admin
exports.updatePlan = async (req, res) => {
  try {
    const plan = await PremiumPlan.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }
    res.json(plan);
  } catch (error) {
    console.error('Error updating plan:', error);
    res.status(500).json({ message: error.message || 'Failed to update plan' });
  }
};

// @desc    Delete a premium plan (admin only)
// @route   DELETE /api/premium/admin/plans/:id
// @access  Private/Admin
exports.deletePlan = async (req, res) => {
  try {
    const plan = await PremiumPlan.findByIdAndDelete(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }
    res.json({ message: 'Plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting plan:', error);
    res.status(500).json({ message: error.message || 'Failed to delete plan' });
  }
};

// @desc    Toggle premium plan active status (admin only)
// @route   PUT /api/premium/admin/plans/:id/toggle
// @access  Private/Admin
exports.togglePlanStatus = async (req, res) => {
  try {
    const plan = await PremiumPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }
    plan.isActive = !plan.isActive;
    await plan.save();
    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Purchase premium using wallet balance
// @route   POST /api/premium/purchase-with-wallet
// @access  Private
exports.purchaseWithWallet = async (req, res) => {
  try {
    const { planId, badge } = req.body;
    let user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let plan = null;
    if (planId) {
      plan = await PremiumPlan.findById(planId);
    } else if (badge) {
      plan = await PremiumPlan.findOne({ badge, isActive: true });
    }

    // Default to Bronze if plan not specified
    if (!plan) {
      plan = await PremiumPlan.findOne({ badge: 'bronze', isActive: true }) || {
        name: 'Bronze Plan',
        badge: 'bronze',
        price: 500,
        durationDays: 7,
      };
    }

    const price = plan.price;
    const durationDays = plan.durationDays;
    const planBadge = plan.badge;

    // Atomically deduct from wallet (prevents race conditions)
    const updatedWallet = await Wallet.findOneAndUpdate(
      { user: req.user._id, balance: mongoose.trusted({ $gte: price }) },
      { $inc: { balance: -price, totalSpent: price } },
      { new: true }
    );

    if (!updatedWallet) {
      const wallet = await Wallet.findOne({ user: req.user._id });
      return res.status(400).json({ 
        message: 'Insufficient wallet balance',
        required: price,
        available: wallet?.balance || 0
      });
    }

    const wallet = updatedWallet;
    const balanceBefore = wallet.balance + price;

    // Create wallet transaction
    await WalletTransaction.create({
      wallet: wallet._id,
      user: req.user._id,
      type: 'purchase',
      amount: price,
      currency: 'LKR',
      description: `Purchased ${plan.name} (${durationDays} Days)`,
      relatedType: 'premium',
      balanceBefore,
      balanceAfter: wallet.balance,
      status: 'completed'
    });

    // Grant premium
    user.isPremium = true;
    user.premiumPlan = planBadge;
    user.premiumSince = new Date();
    user.premiumStartedAt = new Date();
    user.premiumStatus = 'active';
    
    // Extend expiry if already premium and active
    const currentExpiry = (user.premiumExpiresAt && new Date(user.premiumExpiresAt) > new Date())
      ? new Date(user.premiumExpiresAt)
      : new Date();
    user.premiumExpiresAt = new Date(currentExpiry.getTime() + durationDays * 24 * 60 * 60 * 1000);
    user.premiumExpirySentNotification = false;
    await user.save();

    logAuditEvent({
      userId: user._id,
      action: 'PREMIUM_PURCHASE_WALLET',
      targetId: user._id,
      targetType: 'User',
      details: { plan: plan.name, price, durationDays },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Send activation notification
    await Notification.create({
      user: user._id,
      type: 'premium_activated',
      message: `🎉 Congratulations! Your ${planBadge.toUpperCase()} Premium membership is now active for ${durationDays} days!`,
    });

    res.json({ 
      message: `Successfully subscribed to ${plan.name}`,
      isPremium: true,
      premiumPlan: user.premiumPlan,
      premiumExpiresAt: user.premiumExpiresAt
    });
  } catch (error) {
    console.error('Error purchasing premium with wallet:', error);
    res.status(500).json({ message: 'Failed to purchase premium' });
  }
};

// @desc    Create a premium payment request
// @route   POST /api/premium/request
// @access  Private
exports.createPaymentRequest = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.pendingPremiumRequest) {
      return res.status(400).json({ message: 'You already have a pending premium request' });
    }

    const { bank, accountHolderName, email, phoneNumber, paymentDate, paymentAmount, planId, planBadge, transactionReference, paymentMethod, notes } = req.body;
    if (!bank || !accountHolderName || !email || !phoneNumber || !paymentDate || !paymentAmount) {
      return res.status(400).json({ message: 'All required fields must be completed' });
    }

    if (!isValidPhoneNumber(phoneNumber)) {
      return res.status(400).json({ message: 'Phone number must contain only numbers' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload payment slip' });
    }

    // Resolve plan
    let plan = null;
    if (planId) {
      plan = await PremiumPlan.findById(planId);
    } else if (planBadge) {
      plan = await PremiumPlan.findOne({ badge: planBadge });
    }

    const selectedBadge = plan?.badge || planBadge || (parseFloat(paymentAmount) >= 3000 ? 'gold' : parseFloat(paymentAmount) >= 1300 ? 'silver' : 'bronze');
    const selectedDuration = plan?.durationDays || (selectedBadge === 'gold' ? 60 : selectedBadge === 'silver' ? 21 : 10);

    // Upload payment slip to Cloudinary
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'premium_payment_slips',
      resource_type: 'auto',
    });

    const paymentRequest = await PremiumPaymentRequest.create({
      user: req.user._id,
      bank,
      paymentMethod: paymentMethod || 'bank_transfer',
      accountHolderName,
      email,
      phoneNumber,
      transactionReference: transactionReference || `PREM-${Date.now()}`,
      paymentDate,
      paymentAmount: parseFloat(paymentAmount),
      paymentSlipUrl: result.secure_url,
      notes: notes || '',
      plan: plan?._id || null,
      planBadge: selectedBadge,
      durationDays: selectedDuration,
    });

    user.premiumRequested = true;
    user.pendingPremiumRequest = paymentRequest._id;
    await user.save();

    res.status(201).json(paymentRequest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user's premium status and pending request
// @route   GET /api/premium/status
// @access  Private
exports.getPremiumStatus = async (req, res) => {
  try {
    let user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check expiration status automatically
    user = await checkUserPremiumStatus(user);

    const pendingRequest = user.pendingPremiumRequest 
      ? await PremiumPaymentRequest.findById(user.pendingPremiumRequest) 
      : null;

    const premiumDetails = getUserPremiumDetails(user);

    res.json({
      isPremium: user.isPremium,
      premiumPlan: user.premiumPlan,
      premiumSince: user.premiumSince,
      premiumStartedAt: user.premiumStartedAt,
      premiumExpiresAt: user.premiumExpiresAt,
      premiumStatus: user.premiumStatus,
      premiumRequested: user.premiumRequested,
      pendingRequest,
      messagesSent: user.messagesSent,
      limit: 5,
      features: premiumDetails.features,
      daysRemaining: premiumDetails.daysRemaining,
      effectivePlan: premiumDetails.plan,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all premium payment requests (admin only)
// @route   GET /api/admin/premium-requests
// @access  Private/Admin
exports.getAllRequests = async (req, res) => {
  try {
    const requests = await PremiumPaymentRequest.find({})
      .populate('user', 'name email phoneNumber profileImageUrl')
      .populate('plan')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve premium payment request (admin only)
// @route   PUT /api/admin/premium-requests/:id/approve
// @access  Private/Admin
exports.approveRequest = async (req, res) => {
  try {
    // Atomic status transition prevents concurrency race conditions
    const request = await PremiumPaymentRequest.findOneAndUpdate(
      { _id: req.params.id, status: 'pending' },
      { $set: { status: 'approved' } },
      { new: true }
    );

    if (!request) {
      return res.status(400).json({ message: 'Request not found or already processed' });
    }

    const user = await User.findById(request.user);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const planBadge = request.planBadge || (request.paymentAmount >= 3000 ? 'gold' : request.paymentAmount >= 1300 ? 'silver' : 'bronze');
    const durationDays = request.durationDays || (planBadge === 'gold' ? 60 : planBadge === 'silver' ? 21 : 10);

    user.isPremium = true;
    user.premiumPlan = planBadge;
    user.premiumSince = new Date();
    user.premiumStartedAt = new Date();
    user.premiumStatus = 'active';
    
    const currentExpiry = (user.premiumExpiresAt && new Date(user.premiumExpiresAt) > new Date())
      ? new Date(user.premiumExpiresAt)
      : new Date();
    user.premiumExpiresAt = new Date(currentExpiry.getTime() + durationDays * 24 * 60 * 60 * 1000);
    user.premiumRequested = false;
    user.pendingPremiumRequest = null;
    user.premiumExpirySentNotification = false;
    await user.save();

    // Create a completed WalletTransaction of type purchase for transaction history
    let wallet = await Wallet.findOne({ user: user._id });
    if (!wallet) {
      wallet = await Wallet.create({ user: user._id });
    }
    await WalletTransaction.create({
      wallet: wallet._id,
      user: user._id,
      type: 'purchase',
      amount: request.paymentAmount,
      currency: 'LKR',
      description: `Admin approved ${planBadge.toUpperCase()} Premium Membership (${durationDays} Days) via ${request.bank}`,
      relatedType: 'premium',
      relatedId: request._id,
      balanceBefore: wallet.balance,
      balanceAfter: wallet.balance,
      status: 'completed'
    });

    logAuditEvent({
      userId: req.user._id,
      action: 'ADMIN_APPROVE_PREMIUM_REQUEST',
      targetId: request._id,
      targetType: 'PremiumPaymentRequest',
      details: { userId: user._id, planBadge, durationDays },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Send notification to user
    await Notification.create({
      user: user._id,
      type: 'premium_activated',
      message: `🎉 Great news! Admin approved your payment. Your ${planBadge.toUpperCase()} Premium membership is active for ${durationDays} days!`,
    });

    res.json({ message: 'Premium request approved successfully', user, request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject premium payment request (admin only)
// @route   PUT /api/admin/premium-requests/:id/reject
// @access  Private/Admin
exports.rejectRequest = async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const request = await PremiumPaymentRequest.findOneAndUpdate(
      { _id: req.params.id, status: 'pending' },
      {
        $set: {
          status: 'rejected',
          rejectionReason: rejectionReason || 'No reason provided',
        }
      },
      { new: true }
    );

    if (!request) {
      return res.status(400).json({ message: 'Request not found or already processed' });
    }

    const user = await User.findById(request.user);
    if (user) {
      user.premiumRequested = false;
      user.pendingPremiumRequest = null;
      await user.save();

      await Notification.create({
        user: user._id,
        type: 'profile_reminder',
        message: `Your premium request was rejected: ${rejectionReason || 'Invalid slip or mismatch'}`,
      });
    }

    logAuditEvent({
      userId: req.user._id,
      action: 'ADMIN_REJECT_PREMIUM_REQUEST',
      targetId: request._id,
      targetType: 'PremiumPaymentRequest',
      details: { userId: request.user, reason: rejectionReason },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ message: 'Premium request rejected successfully', request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
