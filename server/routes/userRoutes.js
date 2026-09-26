const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { 
  updateProfile, 
  getAllUsers, 
  getUserById, 
  searchUsers,
  getMatches,
  getAdminUser,
  blockUser,
  unblockUser,
  getBlockedUsers,
  acknowledgePrivacyPolicy,
  getConsentHistory,
  exportUserData,
  requestAccountDeletion,
  getProfileVisitors,
  getSpotlightUsers,
  uploadGalleryPhoto,
  deleteGalleryPhoto,
  setMainGalleryPhoto,
  reorderGalleryPhotos,
} = require('../controllers/userController');
const { protect, approved } = require('../middleware/auth');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');

// Photo Gallery Routes (Max 4 photos, min 1)
router.post('/photos', protect, upload('photo'), uploadGalleryPhoto);
router.delete('/photos/:photoId', protect, deleteGalleryPhoto);
router.put('/photos/:photoId/main', protect, setMainGalleryPhoto);
router.put('/photos/reorder', protect, reorderGalleryPhotos);

router.put(
  '/profile',
  protect,
  [
    body('phoneNumber').optional().matches(/^[0-9]+$/).withMessage('Phone number must contain only numbers'),
    body('age').optional().isInt({ min: 18, max: 100 }).withMessage('Age must be between 18 and 100'),
    body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Gender must be male, female, or other'),
    body('profileAvatar').optional().isIn(['', 'male-1', 'male-2', 'male-3', 'female-1', 'female-2', 'female-3', 'neutral-1', 'neutral-2', 'neutral-3']).withMessage('Invalid profile avatar selection'),
    body('language').optional().isIn(['en', 'si', 'ta']).withMessage('Language must be en, si, or ta'),
  ],
  validate,
  updateProfile
);
router.get('/', protect, approved, getAllUsers);
router.get('/search', protect, approved, searchUsers);
router.get('/matches', protect, approved, getMatches);
router.get('/visitors', protect, approved, getProfileVisitors);
router.get('/spotlight', protect, approved, getSpotlightUsers);
router.get('/admin', protect, getAdminUser);
router.get('/consent-history', protect, getConsentHistory);
router.get('/export-data', protect, exportUserData);
router.post('/request-deletion', protect, requestAccountDeletion);
router.post('/acknowledge-privacy-policy', protect, acknowledgePrivacyPolicy);
router.get('/blocked', protect, getBlockedUsers);
router.post('/:id/block', protect, blockUser);
router.post('/:id/unblock', protect, unblockUser);
router.get('/:id', protect, approved, getUserById);

module.exports = router;
