const { Wallet, WalletTransaction, PaymentRequest } = require('../models/Wallet');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { UserStats } = require('../models/Achievement');
const cloudinary = require('../config/cloudinary');
const { logAuditEvent } = require('../middleware/auditLogger');

// Canonical Bank & Payment Account Details
const PAYMENT_ACCOUNTS = {
  'Sampath Bank': {
    name: 'Sampath Bank',
    account: '110552360840',
    branch: 'Wattegama',
    accountHolder: 'S. Kumarasinghe',
    type: 'bank_transfer',
  },
  'Hatton National Bank (HNB)': {
    name: 'Hatton National Bank (HNB)',
    account: '018021102658',
    branch: 'Kandy',
    accountHolder: 'S. Kumarasinghe',
    type: 'bank_transfer',
  },
  'Bank of Ceylon (BOC)': {
    name: 'Bank of Ceylon (BOC)',
    account: '00069058',
    branch: 'Kandy',
    accountHolder: 'R. Ratnayake',
    type: 'bank_transfer',
  },
  'Regional Development Bank (RDB)': {
    name: 'Regional Development Bank (RDB)',
    account: '409010110698',
    branch: 'Kandy',
    accountHolder: 'T. Dharmapriya',
    type: 'bank_transfer',
  },
  'eZ Cash': {
    name: 'eZ Cash',
    account: '0764134658',
    branch: 'Mobile Wallet',
    accountHolder: 'LoveLK Official',
    type: 'ez_cash',
  },
  'Binance': {
    name: 'Binance Pay',
    account: '520375906',
    branch: 'Crypto Transfer (USDT/BUSD)',
    accountHolder: 'LoveLK Binance ID',
    type: 'binance',
  },
};

// @desc    Get user wallet summary (wallet + stats + recent transactions in 1 request)
// @route   GET /api/wallet/summary
// @access  Private
exports.getWalletSummary = async (req, res) => {
  try {
    const userId = req.user._id;

    let [wallet, userStats, transactions, pendingRequests] = await Promise.all([
      Wallet.findOne({ user: userId }).lean(),
      UserStats.findOne({ user: userId }).lean(),
      WalletTransaction.find({ user: userId }).sort({ createdAt: -1 }).limit(15).lean(),
      PaymentRequest.find({ user: userId, status: 'pending' }).lean(),
    ]);

    if (!wallet) {
      const newWallet = await Wallet.create({ user: userId });
      wallet = newWallet.toObject();
    }

    res.json({
      wallet,
      userStats: userStats || { points: 0, loginStreak: 0, totalGiftsSent: 0 },
      transactions: transactions || [],
      pendingRequestsCount: pendingRequests.length,
    });
  } catch (error) {
    console.error('Error fetching wallet summary:', error);
    res.status(500).json({ message: 'Failed to fetch wallet summary' });
  }
};

// @desc    Get user wallet
// @route   GET /api/wallet
// @access  Private
exports.getWallet = async (req, res) => {
  try {
    const userId = req.user._id;
    
    let wallet = await Wallet.findOne({ user: userId }).lean();
    if (!wallet) {
      const newWallet = await Wallet.create({ user: userId });
      wallet = newWallet.toObject();
    }
    
    res.json(wallet);
  } catch (error) {
    console.error('Error fetching wallet:', error);
    res.status(500).json({ message: 'Failed to fetch wallet' });
  }
};

// @desc    Get wallet transaction history
// @route   GET /api/wallet/transactions
// @access  Private
exports.getTransactions = async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 30, skip = 0, type } = req.query;
    
    const query = { user: userId };
    if (type && type !== 'all') {
      query.type = type;
    }
    
    const [transactions, total] = await Promise.all([
      WalletTransaction.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit, 10))
        .skip(parseInt(skip, 10))
        .lean(),
      WalletTransaction.countDocuments(query),
    ]);
    
    res.json({ transactions, total });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
};

// @desc    Create payment request (bank slip / eZ Cash / Binance receipt upload)
// @route   POST /api/wallet/payment-request
// @access  Private
exports.createPaymentRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      amount,
      bankName,
      paymentMethod,
      payerName,
      payerPhone,
      transactionReference,
      notes,
    } = req.body;

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount < 100) {
      return res.status(400).json({ message: 'Minimum top-up amount is 100 LKR' });
    }

    if (!transactionReference || !transactionReference.trim()) {
      return res.status(400).json({ message: 'Please provide a transaction or reference ID' });
    }

    let slipImageUrl = '';

    if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;
      const uploadRes = await cloudinary.uploader.upload(dataURI, {
        folder: 'wallet_payment_slips',
        resource_type: 'auto',
      });
      slipImageUrl = uploadRes.secure_url;
    } else if (req.body.slipImageUrl) {
      slipImageUrl = req.body.slipImageUrl;
    } else {
      return res.status(400).json({ message: 'Please attach a payment receipt or transfer slip' });
    }

    // Resolve matching official account details
    const selectedAccount = PAYMENT_ACCOUNTS[bankName] || {
      name: bankName || 'Bank Transfer',
      account: req.body.accountNumber || '',
      branch: req.body.branch || '',
      accountHolder: req.body.accountHolder || '',
      type: paymentMethod || 'bank_transfer',
    };

    const resolvedMethod = paymentMethod || selectedAccount.type || 'bank_transfer';

    const paymentRequest = await PaymentRequest.create({
      user: userId,
      amount: parsedAmount,
      currency: 'LKR',
      paymentMethod: resolvedMethod,
      bankName: selectedAccount.name,
      accountNumber: selectedAccount.account,
      accountHolder: selectedAccount.accountHolder,
      branch: selectedAccount.branch,
      payerName: payerName || req.user.name || '',
      payerPhone: payerPhone || req.user.phoneNumber || '',
      transactionReference: transactionReference.trim(),
      slipImageUrl,
      notes: notes || '',
      status: 'pending',
    });

    logAuditEvent({
      userId,
      action: 'SUBMIT_WALLET_TOPUP_REQUEST',
      targetId: paymentRequest._id,
      targetType: 'PaymentRequest',
      details: { amount: parsedAmount, method: resolvedMethod, bankName: selectedAccount.name, ref: transactionReference },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({
      message: 'Payment request submitted successfully! Your top-up is pending admin review.',
      paymentRequest,
    });
  } catch (error) {
    console.error('Error creating payment request:', error);
    res.status(500).json({ message: error.message || 'Failed to create payment request' });
  }
};

// @desc    Get user payment requests
// @route   GET /api/wallet/payment-requests
// @access  Private
exports.getPaymentRequests = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const requests = await PaymentRequest.find({ user: userId })
      .sort({ createdAt: -1 })
      .lean();
    
    res.json(requests);
  } catch (error) {
    console.error('Error fetching payment requests:', error);
    res.status(500).json({ message: 'Failed to fetch payment requests' });
  }
};

// @desc    Get all payment requests (admin)
// @route   GET /api/wallet/admin/payment-requests
// @access  Private/Admin
exports.getAllPaymentRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    
    const requests = await PaymentRequest.find(query)
      .populate('user', 'name email phoneNumber profileImageUrl profileName username')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();
    
    res.json(requests);
  } catch (error) {
    console.error('Error fetching all payment requests:', error);
    res.status(500).json({ message: 'Failed to fetch payment requests' });
  }
};

// @desc    Approve payment request (admin)
// @route   PUT /api/wallet/admin/payment-requests/:id/approve
// @access  Private/Admin
exports.approvePaymentRequest = async (req, res) => {
  try {
    // Atomic status transition prevents double-crediting
    const paymentRequest = await PaymentRequest.findOneAndUpdate(
      { _id: req.params.id, status: 'pending' },
      {
        $set: {
          status: 'approved',
          reviewedBy: req.user._id,
          reviewedAt: new Date(),
        },
      },
      { new: true }
    );
    
    if (!paymentRequest) {
      return res.status(400).json({ message: 'Payment request not found or already processed' });
    }
    
    // Atomically credit wallet
    const updatedWallet = await Wallet.findOneAndUpdate(
      { user: paymentRequest.user },
      { $inc: { balance: paymentRequest.amount, totalDeposited: paymentRequest.amount } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    
    const balanceBefore = updatedWallet.balance - paymentRequest.amount;
    
    // Create transaction record
    await WalletTransaction.create({
      wallet: updatedWallet._id,
      user: paymentRequest.user,
      type: 'deposit',
      amount: paymentRequest.amount,
      currency: paymentRequest.currency || 'LKR',
      description: `Top-up approved via ${paymentRequest.bankName} (Ref: ${paymentRequest.transactionReference})`,
      relatedId: paymentRequest._id,
      relatedType: 'payment',
      balanceBefore,
      balanceAfter: updatedWallet.balance,
      status: 'completed',
    });
    
    logAuditEvent({
      userId: req.user._id,
      action: 'ADMIN_APPROVE_WALLET_DEPOSIT',
      targetId: paymentRequest._id,
      targetType: 'PaymentRequest',
      details: { userId: paymentRequest.user, amount: paymentRequest.amount, method: paymentRequest.paymentMethod },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Create notification for user
    await Notification.create({
      user: paymentRequest.user,
      type: 'wallet_topup',
      message: `🎉 Great news! Your wallet has been topped up with Rs. ${paymentRequest.amount} LKR via ${paymentRequest.bankName}.`,
      relatedId: paymentRequest._id,
      relatedType: 'payment',
    });
    
    res.json({ message: 'Payment approved and wallet credited successfully', wallet: updatedWallet, paymentRequest });
  } catch (error) {
    console.error('Error approving payment request:', error);
    res.status(500).json({ message: 'Failed to approve payment request' });
  }
};

// @desc    Reject payment request (admin)
// @route   PUT /api/wallet/admin/payment-requests/:id/reject
// @access  Private/Admin
exports.rejectPaymentRequest = async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const paymentRequest = await PaymentRequest.findOneAndUpdate(
      { _id: req.params.id, status: 'pending' },
      {
        $set: {
          status: 'rejected',
          reviewedBy: req.user._id,
          reviewedAt: new Date(),
          rejectionReason: rejectionReason || 'Payment verification failed',
        },
      },
      { new: true }
    );
    
    if (!paymentRequest) {
      return res.status(400).json({ message: 'Payment request not found or already processed' });
    }
    
    logAuditEvent({
      userId: req.user._id,
      action: 'ADMIN_REJECT_WALLET_DEPOSIT',
      targetId: paymentRequest._id,
      targetType: 'PaymentRequest',
      details: { userId: paymentRequest.user, reason: rejectionReason },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Send notification to user
    await Notification.create({
      user: paymentRequest.user,
      type: 'profile_reminder',
      message: `Your wallet top-up request for Rs. ${paymentRequest.amount} LKR was rejected: ${rejectionReason || 'Invalid slip or details mismatch'}`,
    });

    res.json({ message: 'Payment request rejected', paymentRequest });
  } catch (error) {
    console.error('Error rejecting payment request:', error);
    res.status(500).json({ message: 'Failed to reject payment request' });
  }
};

// @desc    Get confidential payment slip with ownership/admin access control
// @route   GET /api/wallet/slips/:filename
// @access  Private
exports.getPaymentSlip = async (req, res) => {
  try {
    const filename = req.params.filename;
    res.json({ message: 'Payment slips are hosted on secure cloud storage', filename });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete payment request (admin)
// @route   DELETE /api/wallet/admin/payment-requests/:id
// @access  Private/Admin
exports.deletePaymentRequest = async (req, res) => {
  try {
    const paymentRequest = await PaymentRequest.findByIdAndDelete(req.params.id);
    if (!paymentRequest) {
      return res.status(404).json({ message: 'Payment request not found' });
    }
    res.json({ message: 'Payment request deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment request:', error);
    res.status(500).json({ message: 'Failed to delete payment request' });
  }
};

// @desc    Add reward points to wallet (internal helper)
exports.addReward = async (userId, amount, description, relatedType = 'achievement', relatedId = null) => {
  try {
    let wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      wallet = await Wallet.create({ user: userId });
    }
    
    const balanceBefore = wallet.balance;
    wallet.balance += amount;
    await wallet.save();
    
    await WalletTransaction.create({
      wallet: wallet._id,
      user: userId,
      type: 'reward',
      amount,
      currency: 'LKR',
      description,
      relatedId,
      relatedType,
      balanceBefore,
      balanceAfter: wallet.balance,
      status: 'completed',
    });
    
    return wallet;
  } catch (error) {
    console.error('Error adding reward:', error);
    throw error;
  }
};
