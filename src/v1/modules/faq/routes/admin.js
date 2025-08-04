const express = require('express');
const { authenticate, adminOnly } = require('../../../../middlewares/auth');
const {
  getAllFAQs,
  getFAQById,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  toggleFAQStatus,
  reorderFAQs,
  getFAQCategories,
  getFAQStats
} = require('../controllers/admin');

const router = express.Router();

// Apply authentication and admin middleware to all routes
router.use(authenticate, adminOnly);

// FAQ management routes
router.get('/stats', getFAQStats);
router.get('/categories', getFAQCategories);
router.get('/', getAllFAQs);
router.get('/:id', getFAQById);
router.post('/', createFAQ);
router.put('/:id', updateFAQ);
router.delete('/:id', deleteFAQ);
router.patch('/:id/toggle-status', toggleFAQStatus);
router.patch('/reorder', reorderFAQs);

module.exports = router;
