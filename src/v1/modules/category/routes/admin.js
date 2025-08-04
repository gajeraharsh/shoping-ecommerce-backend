const express = require('express');
const { authenticate, adminOnly } = require('../../../../middlewares/auth');
const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
  getCategoryStats,
  reorderCategories
} = require('../controllers/admin');

const router = express.Router();

// Apply authentication and admin middleware to all routes
router.use(authenticate, adminOnly);

// Category management routes
router.get('/stats', getCategoryStats);
router.get('/', getAllCategories);
router.get('/:id', getCategoryById);
router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);
router.patch('/:id/toggle-status', toggleCategoryStatus);
router.patch('/reorder', reorderCategories);

module.exports = router;
