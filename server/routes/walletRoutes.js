const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
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
const { paymentLimiter } = require('../middleware/rateLimiters');
const { validateFileOnDisk } = require('../utils/fileSignature');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads/payment-slips');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, 'slip-' + uniqueSuffix + ext);
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
      cb(new Error('Only safe images (jpeg, jpg, png) and PDF files are allowed'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Middleware verifying magic bytes of uploaded payment slip on disk
const verifySlipMagicBytes = (req, res, next) => {
  if (req.file && req.file.path) {
    const validation = validateFileOnDisk(req.file.path, ['image/jpeg', 'image/png', 'application/pdf']);
    if (!validation.valid) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {}
      return res.status(400).json({
        success: false,
        message: validation.reason || 'Invalid file content signature. File may be corrupted or disguised.',
      });
    }
  }
  next();
};

router.get('/summary', protect, getWalletSummary);
router.get('/', protect, getWallet);
router.get('/transactions', protect, getTransactions);
router.post(
  '/payment-request',
  protect,
  paymentLimiter,
  upload.single('paymentSlip'),
  verifySlipMagicBytes,
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

