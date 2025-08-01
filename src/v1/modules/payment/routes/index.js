const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../../../../middlewares/auth');

// Payment routes
router.get('/methods', authenticate, paymentController.getPaymentMethods);
router.post('/initialize', authenticate, paymentController.initializePayment);
router.get('/:paymentId/status', authenticate, paymentController.getPaymentStatus);
router.post('/callback', paymentController.processPaymentCallback);
router.post('/:paymentId/refund', authenticate, paymentController.refundPayment);

module.exports = router; 