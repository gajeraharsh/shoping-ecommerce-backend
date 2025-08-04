const express = require('express');
const { authenticate, adminOnly } = require('../../../../middlewares/auth');
const {
  getAllBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  toggleBlogStatus,
  bulkUpdateBlogs,
  getBlogStats
} = require('../controllers/admin');

const router = express.Router();

// Apply authentication and admin middleware to all routes
router.use(authenticate, adminOnly);

// Blog management routes
router.get('/stats', getBlogStats);
router.get('/', getAllBlogs);
router.get('/:id', getBlogById);
router.post('/', createBlog);
router.put('/:id', updateBlog);
router.delete('/:id', deleteBlog);
router.patch('/:id/toggle-status', toggleBlogStatus);
router.patch('/bulk-update', bulkUpdateBlogs);

module.exports = router;
