const express = require('express');
const {
  validateCoupon,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon
} = require('../controllers/couponController');
const { authenticate, adminOnly } = require('../../../../middlewares/auth');

const router = express.Router();

router.get('/validate/:code', validateCoupon);
router.get('/', authenticate, adminOnly, getCoupons);
router.post('/', authenticate, adminOnly, createCoupon);
router.put('/:id', authenticate, adminOnly, updateCoupon);
router.delete('/:id', authenticate, adminOnly, deleteCoupon);

module.exports = router;