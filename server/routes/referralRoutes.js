const express = require('express');
const router = express.Router();
const {
  getMyReferralCode,
  applyReferralCode,
  completeReferral,
  getReferralHistory,
  getReferralStats
} = require('../controllers/referralController');
const { protect } = require('../middleware/authMiddleware');

router.route('/my-code').get(protect, getMyReferralCode);
router.route('/apply').post(protect, applyReferralCode);
router.route('/:id/complete').post(protect, completeReferral);
router.route('/history').get(protect, getReferralHistory);
router.route('/stats').get(protect, getReferralStats);

module.exports = router;
