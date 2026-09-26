const express = require('express');
const router = express.Router();
const {
  getGifts,
  sendGift,
  getGiftHistory,
  sendPremiumGift,
  getPremiumGiftTransactions,
  createGift,
  updateGift,
  deleteGift
} = require('../controllers/giftController');
const { protect, admin } = require('../middleware/auth');
const { cacheMiddleware } = require('../middleware/cache');

// Public/Private routes
router.route('/').get(protect, cacheMiddleware(300), getGifts);
router.route('/send').post(protect, sendGift);
router.route('/premium').post(protect, sendPremiumGift);
router.route('/history').get(protect, getGiftHistory);

// Admin routes
router.route('/admin').post(protect, admin, createGift);
router.route('/admin/premium-transactions').get(protect, admin, getPremiumGiftTransactions);
router.route('/admin/:id').put(protect, admin, updateGift).delete(protect, admin, deleteGift);

module.exports = router;
