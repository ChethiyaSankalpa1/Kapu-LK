const { Wallet, WalletTransaction, PaymentRequest } = require('../models/Wallet');
const User = require('../models/User');

// @desc    Get user wallet
// @route   GET /api/wallet
// @access  Private
exports.getWallet = async (req, res) => {
  try {
    const userId = req.user._id;
    
    let wallet = await Wallet.findOne({ user: userId });
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
    
    const transactions = await WalletTransaction.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));
    
    const total = await WalletTransaction.countDocuments(query);
    
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
    const paymentRequest = await PaymentRequest.findById(req.params.id);
    
    if (!paymentRequest) {
      return res.status(404).json({ message: 'Payment request not found' });
    }
    
    if (paymentRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Payment request already processed' });
    }
    
    // Get or create wallet
    let wallet = await Wallet.findOne({ user: paymentRequest.user });
    if (!wallet) {
      wallet = await Wallet.create({ user: paymentRequest.user });
    }
    
    const balanceBefore = wallet.balance;
    wallet.balance += paymentRequest.amount;
    wallet.totalDeposited += paymentRequest.amount;
    await wallet.save();
    
    // Create transaction record
    await WalletTransaction.create({
      wallet: wallet._id,
      user: paymentRequest.user,
      type: 'deposit',
      amount: paymentRequest.amount,
      currency: paymentRequest.currency,
      description: 'Bank deposit approved',
      relatedId: paymentRequest._id,
      relatedType: 'payment',
      balanceBefore,
      balanceAfter: wallet.balance,
      status: 'completed'
    });
    
    // Update payment request
    paymentRequest.status = 'approved';
    paymentRequest.reviewedBy = req.user._id;
    paymentRequest.reviewedAt = new Date();
    await paymentRequest.save();
    
    res.json({ message: 'Payment approved successfully', wallet });
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
    const paymentRequest = await PaymentRequest.findById(req.params.id);
    
    if (!paymentRequest) {
      return res.status(404).json({ message: 'Payment request not found' });
    }
    
    if (paymentRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Payment request already processed' });
    }
    
    paymentRequest.status = 'rejected';
    paymentRequest.reviewedBy = req.user._id;
    paymentRequest.reviewedAt = new Date();
    paymentRequest.rejectionReason = rejectionReason || 'No reason provided';
    await paymentRequest.save();
    
    res.json({ message: 'Payment rejected successfully' });
  } catch (error) {
    console.error('Error rejecting payment request:', error);
    res.status(500).json({ message: 'Failed to reject payment request' });
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
