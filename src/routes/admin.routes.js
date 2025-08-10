/**
 * Admin Routes
 * Mounts all admin-only routes with authentication and role checking
 */

const express = require('express');
const { authenticate, requireRole } = require('../middlewares/auth');

// Import admin module routes
const userRoutes = require('../modules/user/user.route');
const categoryRoutes = require('../modules/category/category.route');
const productRoutes = require('../modules/product/product.route');
const variantRoutes = require('../modules/variant/variant.route');
const orderRoutes = require('../modules/order/order.route');
const discountRoutes = require('../modules/discount/discount.route');
const blogRoutes = require('../modules/blog/blog.route');
const addressRoutes = require('../modules/address/address.route');
const ratingRoutes = require('../modules/rating/rating.route');
const feedRoutes = require('../modules/feed/feed.route');
const instagramRoutes = require('../modules/instagram/instagram.route');

const router = express.Router();

// Apply authentication and admin role requirement to all admin routes
router.use(authenticate);
router.use(requireRole('ADMIN'));

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin-only endpoints for managing the e-commerce platform
 */

/**
 * @swagger
 * /admin:
 *   get:
 *     summary: Admin dashboard info
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin dashboard data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Admin dashboard',
    data: {
      user: req.user,
      timestamp: new Date().toISOString()
    }
  });
});

// Mount admin module routes
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/variants', variantRoutes);
router.use('/orders', orderRoutes);
router.use('/discounts', discountRoutes);
router.use('/blog', blogRoutes);
router.use('/addresses', addressRoutes);
router.use('/ratings', ratingRoutes);
router.use('/feed', feedRoutes);
router.use('/instagram', instagramRoutes);

module.exports = router;
