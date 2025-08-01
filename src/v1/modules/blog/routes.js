const express = require('express');
const { auth } = require('../../../middlewares/auth');
const { admin } = require('../../../middlewares/admin');
const {
  getBlogPosts,
  getBlogPost,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  addComment,
  getComments,
  moderateComment
} = require('./controller');

const router = express.Router();

// Public routes
router.get('/', getBlogPosts);
router.get('/:slug', getBlogPost);
router.get('/:postId/comments', getComments);

// Protected routes (require authentication)
router.post('/:postId/comments', auth, addComment);

// Admin routes
router.post('/', auth, admin, createBlogPost);
router.put('/:id', auth, admin, updateBlogPost);
router.delete('/:id', auth, admin, deleteBlogPost);
router.patch('/comments/:id/moderate', auth, admin, moderateComment);

module.exports = router; 