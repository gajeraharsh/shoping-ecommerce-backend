const express = require('express');
const { authenticate, adminOnly } = require('../../../../middlewares/auth');
const {
  getAllCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
  bulkUpdateCoupons,
  validateCoupon,
  getCouponStats
} = require('../controllers/admin');

const router = express.Router();

// Apply authentication and admin middleware to all routes
router.use(authenticate, adminOnly);

// Coupon management routes
router.get('/stats', getCouponStats);
router.get('/validate/:code', validateCoupon);
router.get('/', getAllCoupons);
router.get('/:id', getCouponById);
router.post('/', createCoupon);
router.put('/:id', updateCoupon);
router.delete('/:id', deleteCoupon);
router.patch('/:id/toggle-status', toggleCouponStatus);
router.patch('/bulk-update', bulkUpdateCoupons);

module.exports = router;
