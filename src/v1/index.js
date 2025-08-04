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

// Import admin routes
const adminUserRoutes = require('./modules/user/routes/admin');
const adminProductRoutes = require('./modules/product/routes/admin');
const adminCategoryRoutes = require('./modules/category/routes/admin');
const adminOrderRoutes = require('./modules/order/routes/admin');
const adminFaqRoutes = require('./modules/faq/routes/admin');
const adminNewsletterRoutes = require('./modules/newsletter/routes/admin');
const adminSeoRoutes = require('./modules/seo/routes/admin');
const adminAuditRoutes = require('./modules/audit/routes/admin');
const adminInstagramRoutes = require('./modules/instagram/routes/admin');
const adminBlogRoutes = require('./modules/blog/routes/admin');
const adminBannerRoutes = require('./modules/banner/routes/admin');
const adminCouponRoutes = require('./modules/coupon/routes/admin');
const adminInventoryRoutes = require('./modules/inventory/routes/admin');

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

// Admin routes
router.use('/admin/users', adminUserRoutes);
router.use('/admin/products', adminProductRoutes);
router.use('/admin/categories', adminCategoryRoutes);
router.use('/admin/orders', adminOrderRoutes);
router.use('/admin/faqs', adminFaqRoutes);
router.use('/admin/newsletter', adminNewsletterRoutes);
router.use('/admin/seo', adminSeoRoutes);
router.use('/admin/audit', adminAuditRoutes);
router.use('/admin/instagram', adminInstagramRoutes);
router.use('/admin/blogs', adminBlogRoutes);
router.use('/admin/banners', adminBannerRoutes);
router.use('/admin/coupons', adminCouponRoutes);
router.use('/admin/inventory', adminInventoryRoutes);

module.exports = router;