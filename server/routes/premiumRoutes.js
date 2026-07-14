const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  createPaymentRequest,
  getPremiumStatus,
} = require('../controllers/premiumController');

router.post('/request', protect, upload.single('paymentSlip'), createPaymentRequest);
router.get('/status', protect, getPremiumStatus);

module.exports = router;
