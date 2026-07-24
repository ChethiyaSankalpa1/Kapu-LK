const express = require('express');
const router = express.Router();
const {
  getRedemptionConfigs,
  getRedemptionHistory,
  redeemPoints,
  getAllRedemptions,
  updateRedemptionConfig,
  createRedemptionConfig
} = require('../controllers/redemptionController');
const { protect, admin } = require('../middleware/auth');

// Public routes
router.get('/configs', getRedemptionConfigs);

// Private routes
router.get('/history', protect, getRedemptionHistory);
router.post('/redeem', protect, redeemPoints);

// Admin routes
router.get('/admin/all', protect, admin, getAllRedemptions);
router.post('/admin/config', protect, admin, createRedemptionConfig);
router.put('/admin/config/:id', protect, admin, updateRedemptionConfig);

module.exports = router;
