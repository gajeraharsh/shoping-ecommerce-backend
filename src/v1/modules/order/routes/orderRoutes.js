const express = require('express');
const {
  createOrder,
  getUserOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  trackOrder,
  cancelOrder,
  requestReturn,
  downloadInvoice
} = require('../controllers/orderController');
const { authenticate, adminOnly } = require('../../../../middlewares/auth');

const router = express.Router();

router.use(authenticate);

router.post('/', createOrder);
router.get('/', getUserOrders);
router.get('/admin', adminOnly, getAllOrders);
router.get('/:id', getOrderById);
router.put('/:id/status', adminOnly, updateOrderStatus);
router.get('/:id/track', trackOrder);
router.post('/:id/cancel', cancelOrder);
router.post('/:id/return', requestReturn);
router.get('/:id/invoice', downloadInvoice);

module.exports = router;