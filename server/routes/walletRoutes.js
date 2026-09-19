const express = require('express');
const router = express.Router();
const {
  getWalletSummary,
  getWallet,
  getTransactions,
  createPaymentRequest,
  getPaymentRequests,
  getAllPaymentRequests,
  approvePaymentRequest,
  rejectPaymentRequest,
  deletePaymentRequest,
  getPaymentSlip,
} = require('../controllers/walletController');
const { protect, admin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { paymentLimiter } = require('../middleware/rateLimiters');

router.get('/summary', protect, getWalletSummary);
router.get('/', protect, getWallet);
router.get('/transactions', protect, getTransactions);
router.post(
  '/payment-request',
  protect,
  paymentLimiter,
  upload('paymentSlip'),
  createPaymentRequest
);
router.get('/payment-requests', protect, getPaymentRequests);
router.get('/slips/:filename', protect, getPaymentSlip);

// Admin routes
router.get('/admin/payment-requests', protect, admin, getAllPaymentRequests);
router.put('/admin/payment-requests/:id/approve', protect, admin, approvePaymentRequest);
router.put('/admin/payment-requests/:id/reject', protect, admin, rejectPaymentRequest);
router.delete('/admin/payment-requests/:id', protect, admin, deletePaymentRequest);

module.exports = router;

