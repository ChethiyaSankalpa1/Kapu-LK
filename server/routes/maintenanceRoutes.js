const express = require('express');
const router = express.Router();
const {
  getMaintenanceStatus,
  subscribeComingSoon,
  getAdminMaintenanceConfig,
  updateAdminMaintenanceConfig,
  endMaintenanceNow,
} = require('../controllers/maintenanceController');
const { protect, admin } = require('../middleware/auth');

// Public routes
router.get('/status', getMaintenanceStatus);
router.post('/coming-soon/subscribe', subscribeComingSoon);

// Admin controls
router.get('/admin', protect, admin, getAdminMaintenanceConfig);
router.put('/admin', protect, admin, updateAdminMaintenanceConfig);
router.post('/admin/end', protect, admin, endMaintenanceNow);

module.exports = router;
