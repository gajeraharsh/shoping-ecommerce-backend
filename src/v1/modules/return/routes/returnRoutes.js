const express = require('express');
const {
  getUserReturns,
  getReturnById,
  createReturn,
  getEligibleOrders,
  cancelReturn
} = require('../controllers/returnController');
const { authenticate } = require('../../../../middlewares/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get user returns with filtering
router.get('/', getUserReturns);

// Get eligible orders for return
router.get('/eligible-orders', getEligibleOrders);

// Create return request
router.post('/', createReturn);

// Get return by ID
router.get('/:id', getReturnById);

// Cancel return request
router.post('/:id/cancel', cancelReturn);

module.exports = router; 