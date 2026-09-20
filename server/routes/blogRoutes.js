const express = require('express');
const router = express.Router();
const {
  getBlogPosts,
  getAdminBlogPosts,
  getBlogPost,
  createBlogPost,
  updateBlogPost,
  publishBlogPost,
  likeBlogPost,
  addComment,
  deleteBlogPost
} = require('../controllers/blogController');
const { protect, admin } = require('../middleware/auth');

router.route('/').get(getBlogPosts).post(protect, createBlogPost);
router.route('/admin/all').get(protect, admin, getAdminBlogPosts);
router.route('/:slug').get(getBlogPost);
router.route('/:id').put(protect, updateBlogPost).delete(protect, deleteBlogPost);
router.route('/:id/publish').put(protect, publishBlogPost);
router.route('/:id/like').post(protect, likeBlogPost);
router.route('/:id/comments').post(protect, addComment);

module.exports = router;
