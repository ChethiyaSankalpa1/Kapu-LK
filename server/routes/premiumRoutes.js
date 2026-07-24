const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getPlans,
  getAllPlansAdmin,
  createPlan,
  updatePlan,
  deletePlan,
  togglePlanStatus,
  createPaymentRequest,
  getPremiumStatus,
  purchaseWithWallet,
} = require('../controllers/premiumController');

// Public / User routes
router.get('/plans', getPlans);
router.post('/request', protect, upload.single('paymentSlip'), createPaymentRequest);
router.get('/status', protect, getPremiumStatus);
router.post('/purchase-with-wallet', protect, purchaseWithWallet);

// Admin routes
router.get('/admin/plans', protect, admin, getAllPlansAdmin);
router.post('/admin/plans', protect, admin, createPlan);
router.put('/admin/plans/:id', protect, admin, updatePlan);
router.delete('/admin/plans/:id', protect, admin, deletePlan);
router.put('/admin/plans/:id/toggle', protect, admin, togglePlanStatus);

module.exports = router;
