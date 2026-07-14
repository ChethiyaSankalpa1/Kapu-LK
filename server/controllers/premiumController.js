const User = require('../models/User');
const PremiumPaymentRequest = require('../models/PremiumPaymentRequest');
const cloudinary = require('../config/cloudinary');

const isValidPhoneNumber = (value) => !value || /^[0-9]+$/.test(value);

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
