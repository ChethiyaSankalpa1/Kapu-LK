const User = require('../models/User');
const PremiumPaymentRequest = require('../models/PremiumPaymentRequest');
const { Wallet, WalletTransaction } = require('../models/Wallet');
const cloudinary = require('../config/cloudinary');

const isValidPhoneNumber = (value) => !value || /^[0-9]+$/.test(value);

// @desc    Purchase premium using wallet balance
// @route   POST /api/premium/purchase-with-wallet
// @access  Private
exports.purchaseWithWallet = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isPremium) {
      return res.status(400).json({ message: 'You are already a premium member' });
    }

    const PREMIUM_PRICE = 1000; // LKR

    let wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet || wallet.balance < PREMIUM_PRICE) {
      return res.status(400).json({ 
        message: 'Insufficient wallet balance',
        required: PREMIUM_PRICE,
        available: wallet?.balance || 0
      });
    }

    // Deduct from wallet
    const balanceBefore = wallet.balance;
    wallet.balance -= PREMIUM_PRICE;
    wallet.totalSpent += PREMIUM_PRICE;
    await wallet.save();

    // Create wallet transaction
    await WalletTransaction.create({
      wallet: wallet._id,
      user: req.user._id,
      type: 'purchase',
      amount: PREMIUM_PRICE,
      currency: 'LKR',
      description: 'Premium membership purchase',
      relatedType: 'premium',
      balanceBefore,
      balanceAfter: wallet.balance,
      status: 'completed'
    });

    // Grant premium
    user.isPremium = true;
    user.premiumSince = new Date();
    user.premiumExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    await user.save();

    res.json({ 
      message: 'Premium purchased successfully',
      premiumExpiry: user.premiumExpiry
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

    if (user.isPremium) {
      return res.status(400).json({ message: 'You are already a premium member' });
    }

    if (user.pendingPremiumRequest) {
      return res.status(400).json({ message: 'You already have a pending premium request' });
    }

    const { bank, accountHolderName, email, phoneNumber, paymentDate, paymentAmount } = req.body;
    if (!bank || !accountHolderName || !email || !phoneNumber || !paymentDate || !paymentAmount) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!isValidPhoneNumber(phoneNumber)) {
      return res.status(400).json({ message: 'Phone number must contain only numbers' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload payment slip' });
    }

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
      accountHolderName,
      email,
      phoneNumber,
      paymentDate,
      paymentAmount,
      paymentSlipUrl: result.secure_url,
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
    const user = await User.findById(req.user._id);
    const pendingRequest = user.pendingPremiumRequest 
      ? await PremiumPaymentRequest.findById(user.pendingPremiumRequest) 
      : null;

    res.json({
      isPremium: user.isPremium,
      premiumSince: user.premiumSince,
      premiumRequested: user.premiumRequested,
      pendingRequest,
      messagesSent: user.messagesSent,
      limit: 5,
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
    const requests = await PremiumPaymentRequest.find({}).populate('user', 'name email phoneNumber');
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
    const request = await PremiumPaymentRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request is already processed' });
    }

    const user = await User.findById(request.user);
    user.isPremium = true;
    user.premiumSince = new Date();
    user.premiumRequested = false;
    user.pendingPremiumRequest = null;
    await user.save();

    request.status = 'approved';
    await request.save();

    res.json({ message: 'Premium request approved', user, request });
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
    const request = await PremiumPaymentRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request is already processed' });
    }

    const user = await User.findById(request.user);
    user.premiumRequested = false;
    user.pendingPremiumRequest = null;
    await user.save();

    request.status = 'rejected';
    request.rejectionReason = rejectionReason || 'No reason provided';
    await request.save();

    res.json({ message: 'Premium request rejected', user, request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
