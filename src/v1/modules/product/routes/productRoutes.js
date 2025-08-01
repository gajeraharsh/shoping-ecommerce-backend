const express = require('express');
const {
  getProducts,
  getFeaturedProducts,
  getNewProducts,
  getTrendingProducts,
  getProductRecommendations,
  searchProducts,
  getProductVariants,
  getRecentlyViewedProducts,
  markProductAsViewed,
  getProductFilters,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
  getProductsByBrand,
  getProductStats
} = require('../controllers/productController');
const { authenticate, adminOnly } = require('../../../../middlewares/auth');

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/new', getNewProducts);
router.get('/trending', getTrendingProducts);
router.get('/recommendations', getProductRecommendations);
router.get('/search', searchProducts);
router.get('/variants', getProductVariants);
router.get('/filters', getProductFilters);
router.get('/stats', getProductStats);
router.get('/category/:categorySlug', getProductsByCategory);
router.get('/brand/:brandSlug', getProductsByBrand);
router.get('/recently-viewed', authenticate, getRecentlyViewedProducts);
router.get('/:slug', getProductBySlug);

// User routes
router.post('/:productId/view', authenticate, markProductAsViewed);

// Admin routes
router.post('/', authenticate, adminOnly, createProduct);
router.put('/:id', authenticate, adminOnly, updateProduct);
router.delete('/:id', authenticate, adminOnly, deleteProduct);

module.exports = router;