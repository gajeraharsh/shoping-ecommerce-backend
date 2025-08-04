const express = require('express');
const { authenticate, adminOnly } = require('../../../../middlewares/auth');
const {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updateOrder,
  cancelOrder,
  getOrderStats,
  bulkUpdateOrderStatus
} = require('../controllers/admin');

const router = express.Router();

// Apply authentication and admin middleware to all routes
router.use(authenticate, adminOnly);

// Order management routes
router.get('/stats', getOrderStats);
router.get('/', getAllOrders);
router.get('/:id', getOrderById);
router.patch('/:id/status', updateOrderStatus);
router.put('/:id', updateOrder);
router.patch('/:id/cancel', cancelOrder);
router.patch('/bulk-status', bulkUpdateOrderStatus);

module.exports = router;
