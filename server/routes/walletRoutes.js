const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
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

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/payment-slips/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'slip-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (jpeg, jpg, png) and PDF files are allowed'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.get('/', protect, getWallet);
router.get('/transactions', protect, getTransactions);
router.post('/payment-request', protect, upload.single('paymentSlip'), createPaymentRequest);
router.get('/payment-requests', protect, getPaymentRequests);

// Admin routes
router.get('/admin/payment-requests', protect, admin, getAllPaymentRequests);
router.put('/admin/payment-requests/:id/approve', protect, admin, approvePaymentRequest);
router.put('/admin/payment-requests/:id/reject', protect, admin, rejectPaymentRequest);

module.exports = router;
