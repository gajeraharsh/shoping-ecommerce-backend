const express = require('express');

// Import routes
const authRoutes = require('./modules/user/routes/authRoutes');
const userRoutes = require('./modules/user/routes/userRoutes');
const productRoutes = require('./modules/product/routes/productRoutes');
const categoryRoutes = require('./modules/product/routes/categoryRoutes');
const orderRoutes = require('./modules/order/routes/orderRoutes');
const bannerRoutes = require('./modules/banner/routes/bannerRoutes');
const couponRoutes = require('./modules/coupon/routes/couponRoutes');

const router = express.Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/orders', orderRoutes);
router.use('/banners', bannerRoutes);
router.use('/coupons', couponRoutes);

module.exports = router;