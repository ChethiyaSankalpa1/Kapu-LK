const express = require('express');
const router = express.Router();
const {
  getWallet,
  getTransactions,
  createPaymentRequest,
  getPaymentRequests,
  getAllPaymentRequests,
  approvePaymentRequest,
  rejectPaymentRequest
} = require('../controllers/walletController');
const { protect, admin } = require('../middleware/auth');

router.get('/', protect, getWallet);
router.get('/transactions', protect, getTransactions);
router.post('/payment-request', protect, createPaymentRequest);
router.get('/payment-requests', protect, getPaymentRequests);

// Admin routes
router.get('/admin/payment-requests', protect, admin, getAllPaymentRequests);
router.put('/admin/payment-requests/:id/approve', protect, admin, approvePaymentRequest);
router.put('/admin/payment-requests/:id/reject', protect, admin, rejectPaymentRequest);

module.exports = router;
