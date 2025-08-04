const express = require('express');
const { authenticate, adminOnly } = require('../../../../middlewares/auth');
const {
  getAllInstagramPosts,
  getInstagramPostById,
  createInstagramPost,
  updateInstagramPost,
  deleteInstagramPost,
  toggleInstagramPostStatus,
  reorderInstagramPosts,
  bulkUpdateInstagramPosts,
  getInstagramStats,
  syncWithInstagram
} = require('../controllers/admin');

const router = express.Router();

// Apply authentication and admin middleware to all routes
router.use(authenticate, adminOnly);

// Instagram management routes
router.get('/stats', getInstagramStats);
router.post('/sync', syncWithInstagram);
router.get('/', getAllInstagramPosts);
router.get('/:id', getInstagramPostById);
router.post('/', createInstagramPost);
router.put('/:id', updateInstagramPost);
router.delete('/:id', deleteInstagramPost);
router.patch('/:id/toggle-status', toggleInstagramPostStatus);
router.patch('/reorder', reorderInstagramPosts);
router.patch('/bulk-update', bulkUpdateInstagramPosts);

module.exports = router;
