const { Wallet, WalletTransaction, PaymentRequest } = require('../models/Wallet');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { UserStats } = require('../models/Achievement');
const path = require('path');
const fs = require('fs');
const { logAuditEvent } = require('../middleware/auditLogger');

// @desc    Get user wallet summary (wallet + stats + recent transactions in 1 request)
// @route   GET /api/wallet/summary
// @access  Private
exports.getWalletSummary = async (req, res) => {
  try {
    const userId = req.user._id;

    let [wallet, userStats, transactions] = await Promise.all([
      Wallet.findOne({ user: userId }).lean(),
      UserStats.findOne({ user: userId }).lean(),
      WalletTransaction.find({ user: userId }).sort({ createdAt: -1 }).limit(10).lean(),
    ]);

    if (!wallet) {
      wallet = await Wallet.create({ user: userId });
      wallet = wallet.toObject();
    }

    res.json({
      wallet,
      userStats: userStats || { points: 0, loginStreak: 0, totalGiftsSent: 0 },
      transactions: transactions || [],
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
      wallet = await Wallet.create({ user: userId });
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
    const { limit = 20, skip = 0, type } = req.query;
    
    const query = { user: userId };
    if (type) {
      query.type = type;
    }
    
    const [transactions, total] = await Promise.all([
      WalletTransaction.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip))
        .lean(),
      WalletTransaction.countDocuments(query),
    ]);
    
    res.json({ transactions, total });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
};

// @desc    Create payment request (bank slip upload)
// @route   POST /api/wallet/payment-request
// @access  Private
exports.createPaymentRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Handle FormData upload
    if (req.file) {
      const { amount, bankName } = req.body;
      
      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: 'Invalid amount' });
      }
      
      // Get account details based on selected bank
      const bankDetails = {
        'HNB': { name: 'Hatton National Bank', account: '018021102658', branch: 'Kandy', accountHolder: 'S. Kumarasinghe' },
        'Sampath': { name: 'Sampath Bank', account: 'Contact for details', branch: 'Wattegama', accountHolder: 'S. Kumarasinghe' },
        'BOC': { name: 'Bank of Ceylon', account: '00069058', branch: 'Kandy', accountHolder: 'R. Ratnayake' },
        'RDB': { name: 'Regional Development Bank', account: '409010110698', branch: 'Kandy', accountHolder: 'T. Dharmapriya' }
      };
      
      const selectedBank = bankDetails[bankName] || bankDetails['HNB'];
      
      const paymentRequest = await PaymentRequest.create({
        user: userId,
        amount: parseFloat(amount),
        currency: 'LKR',
        paymentMethod: 'bank_transfer',
        bankName: selectedBank.name,
        accountNumber: selectedBank.account,
        branch: selectedBank.branch,
        accountHolder: selectedBank.accountHolder,
        transactionReference: `TXN${Date.now()}`,
        slipImageUrl: `/uploads/payment-slips/${req.file.filename}`,
        status: 'pending'
      });
      
      res.status(201).json(paymentRequest);
    } else {
      // Handle JSON body (legacy)
      const { amount, paymentMethod, bankName, accountNumber, transactionReference, slipImageUrl, notes } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'Invalid amount' });
      }
      
      if (!paymentMethod || !bankName || !accountNumber || !transactionReference || !slipImageUrl) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      const paymentRequest = await PaymentRequest.create({
        user: userId,
        amount,
        currency: 'LKR',
        paymentMethod,
        bankName,
        accountNumber,
        transactionReference,
        slipImageUrl,
        notes,
        status: 'pending'
      });
      
      res.status(201).json(paymentRequest);
    }
  } catch (error) {
    console.error('Error creating payment request:', error);
    res.status(500).json({ message: 'Failed to create payment request' });
  }
};

// @desc    Get user payment requests
// @route   GET /api/wallet/payment-requests
// @access  Private
exports.getPaymentRequests = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const requests = await PaymentRequest.find({ user: userId })
      .sort({ createdAt: -1 });
    
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
    if (status) {
      query.status = status;
    }
    
    const requests = await PaymentRequest.find(query)
      .populate('user', 'name email username')
      .sort({ createdAt: -1 });
    
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
        }
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
      currency: paymentRequest.currency,
      description: 'Bank deposit approved',
      relatedId: paymentRequest._id,
      relatedType: 'payment',
      balanceBefore,
      balanceAfter: updatedWallet.balance,
      status: 'completed'
    });
    
    logAuditEvent({
      userId: req.user._id,
      action: 'ADMIN_APPROVE_WALLET_DEPOSIT',
      targetId: paymentRequest._id,
      targetType: 'PaymentRequest',
      details: { userId: paymentRequest.user, amount: paymentRequest.amount },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Create notification for user
    await Notification.create({
      user: paymentRequest.user,
      type: 'wallet_topup',
      message: `🎉 Congratulations! Your wallet has been topped up with Rs. ${paymentRequest.amount} LKR`,
      relatedId: paymentRequest._id,
      relatedType: 'payment'
    });
    
    res.json({ message: 'Payment approved successfully', wallet: updatedWallet });
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
          rejectionReason: rejectionReason || 'No reason provided',
        }
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

    res.json({ message: 'Payment rejected successfully' });
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
    const filename = path.basename(req.params.filename);
    const slipPath = path.join(__dirname, '../uploads/payment-slips', filename);

    if (!fs.existsSync(slipPath)) {
      return res.status(404).json({ message: 'Payment slip not found' });
    }

    // Access control: User must be admin or the owner of the PaymentRequest
    if (req.user.role !== 'admin') {
      const isOwner = await PaymentRequest.exists({
        user: req.user._id,
        slipImageUrl: { $regex: filename }
      });
      if (!isOwner) {
        logAuditEvent({
          userId: req.user._id,
          action: 'PAYMENT_SLIP_UNAUTHORIZED_ACCESS_ATTEMPT',
          severity: 'warning',
          details: { filename },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });
        return res.status(403).json({ message: 'Access denied to this payment slip' });
      }
    }

    res.sendFile(path.resolve(slipPath));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete payment request (admin)
// @route   DELETE /api/wallet/admin/payment-requests/:id
// @access  Private/Admin
exports.deletePaymentRequest = async (req, res) => {
  try {
    const paymentRequest = await PaymentRequest.findById(req.params.id);
    
    if (!paymentRequest) {
      return res.status(404).json({ message: 'Payment request not found' });
    }
    
    // Delete the payment slip file if it exists
    if (paymentRequest.slipImageUrl) {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '..', paymentRequest.slipImageUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    await PaymentRequest.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Payment request deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment request:', error);
    res.status(500).json({ message: 'Failed to delete payment request' });
  }
};

// @desc    Add reward points to wallet
// @route   POST /api/wallet/reward
// @access  Private (internal use)
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
      status: 'completed'
    });
    
    return wallet;
  } catch (error) {
    console.error('Error adding reward:', error);
    throw error;
  }
};
