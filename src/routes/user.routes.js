/**
 * User Routes
 * Mounts all user-accessible routes with appropriate authentication
 */

const express = require('express');
const { optionalAuth, authenticate } = require('../middlewares/auth');

// Import user module routes
const authRoutes = require('../modules/auth/auth.route');
const categoryRoutes = require('../modules/category/category.route');
const userRoutes = require('../modules/user/user.route');
const productRoutes = require('../modules/product/product.route');
const variantRoutes = require('../modules/variant/variant.route');
const orderRoutes = require('../modules/order/order.route');
const cartRoutes = require('../modules/cart/cart.route');
const wishlistRoutes = require('../modules/wishlist/wishlist.route');
const discountRoutes = require('../modules/discount/discount.route');
const blogRoutes = require('../modules/blog/blog.route');
const addressRoutes = require('../modules/address/address.route');
const ratingRoutes = require('../modules/rating/rating.route');
const feedRoutes = require('../modules/feed/feed.route');
const instagramRoutes = require('../modules/instagram/instagram.route');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: User
 *   description: User-accessible endpoints for browsing and purchasing
 */

/**
 * @swagger
 * /api:
 *   get:
 *     summary: API info
 *     tags: [User]
 *     responses:
 *       200:
 *         description: API information
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'E-commerce API',
    data: {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      documentation: '/docs'
    }
  });
});

// Public routes (no authentication required)
router.use('/auth', authRoutes);
router.use('/categories', optionalAuth, categoryRoutes);
router.use('/products', optionalAuth, productRoutes);
router.use('/variants', optionalAuth, variantRoutes);
router.use('/blog', optionalAuth, blogRoutes);
router.use('/feed', feedRoutes);
router.use('/instagram', instagramRoutes);

// Protected routes (authentication required)
router.use('/profile', authenticate, userRoutes);
router.use('/orders', authenticate, orderRoutes);
router.use('/cart', authenticate, cartRoutes);
router.use('/wishlist', authenticate, wishlistRoutes);
router.use('/addresses', authenticate, addressRoutes);
router.use('/ratings', authenticate, ratingRoutes);

// Discount validation (can be public for code validation)
router.use('/discounts', discountRoutes);

module.exports = router;
