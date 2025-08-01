const express = require('express');
const {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  approveReview
} = require('../controllers/reviewController');
const { authenticate, adminOnly } = require('../../../../middlewares/auth');

const router = express.Router();

// Public routes
router.get('/products/:productId/reviews', getProductReviews);

// User routes
router.post('/products/:productId/reviews', authenticate, createReview);
router.put('/reviews/:id', authenticate, updateReview);
router.delete('/reviews/:id', authenticate, deleteReview);

// Admin routes
router.patch('/reviews/:id/approve', authenticate, adminOnly, approveReview);

module.exports = router; 