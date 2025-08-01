const express = require('express');
const router = express.Router();

// Import all module routes
const authRoutes = require('./modules/auth/routes');
const addressRoutes = require('./modules/address/routes');
const cartRoutes = require('./modules/cart/routes');
const wishlistRoutes = require('./modules/wishlist/routes');
const blogRoutes = require('./modules/blog/routes');
const notificationRoutes = require('./modules/notification/routes');
const contactRoutes = require('./modules/contact/routes');
const searchRoutes = require('./modules/search/routes/searchRoutes');
const returnRoutes = require('./modules/return/routes/returnRoutes');
const paymentRoutes = require('./modules/payment/routes');

// Import existing routes
const userRoutes = require('./modules/user/routes/userRoutes');
const productRoutes = require('./modules/product/routes/productRoutes');
const orderRoutes = require('./modules/order/routes/orderRoutes');
const bannerRoutes = require('./modules/banner/routes/bannerRoutes');
const couponRoutes = require('./modules/coupon/routes/couponRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/addresses', addressRoutes);
router.use('/cart', cartRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/blog', blogRoutes);
router.use('/notifications', notificationRoutes);
router.use('/contact', contactRoutes);
router.use('/search', searchRoutes);
router.use('/returns', returnRoutes);
router.use('/payment', paymentRoutes);

// Existing routes
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/banners', bannerRoutes);
router.use('/coupons', couponRoutes);

module.exports = router;