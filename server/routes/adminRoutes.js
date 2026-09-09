const express = require('express');
const router = express.Router();
const { 
  getAllUsers, 
  approveUser, 
  rejectUser, 
  deleteUser, 
  updateUserRole, 
  toggleUserStatus,
  togglePremiumStatus,
  getDashboardStats,
  createAdmin,
  deletePremiumRequest,
  seedSriLankanContent,
  getInactivityStatus,
  triggerInactivityCleanup,
  cancelUserInactivityDeletion
} = require('../controllers/adminController');
const { 
  getAllRequests, 
  approveRequest, 
  rejectRequest 
} = require('../controllers/premiumController');
const { protect, admin } = require('../middleware/auth');

// Create admin route (use once, then comment out)
router.post('/create-admin', createAdmin);

// Protected admin routes
router.get('/users', protect, admin, getAllUsers);
router.get('/stats', protect, admin, getDashboardStats);
router.put('/users/:id/approve', protect, admin, approveUser);
router.put('/users/:id/reject', protect, admin, rejectUser);
router.put('/users/:id/role', protect, admin, updateUserRole);
router.put('/users/:id/toggle-active', protect, admin, toggleUserStatus);
router.put('/users/:id/toggle-premium', protect, admin, togglePremiumStatus);
router.delete('/users/:id', protect, admin, deleteUser);
router.get('/premium-requests', protect, admin, getAllRequests);
router.put('/premium-requests/:id/approve', protect, admin, approveRequest);
router.put('/premium-requests/:id/reject', protect, admin, rejectRequest);
router.delete('/premium-requests/:id', protect, admin, deletePremiumRequest);
router.post('/seed-sri-lankan-content', protect, admin, seedSriLankanContent);

// Inactivity & Account Lifecycle Controls
router.get('/inactivity/status', protect, admin, getInactivityStatus);
router.post('/inactivity/run-cleanup', protect, admin, triggerInactivityCleanup);
router.post('/inactivity/cancel/:userId', protect, admin, cancelUserInactivityDeletion);

module.exports = router;
