const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/v1/payment/methods:
 *   get:
 *     summary: Get available payment methods
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment methods retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       type:
 *                         type: string
 *                       isActive:
 *                         type: boolean
 */
const getPaymentMethods = async (req, res) => {
  try {
    const paymentMethods = [
      {
        id: 'credit_card',
        name: 'Credit Card',
        type: 'CARD',
        isActive: true,
        description: 'Pay with Visa, MasterCard, or American Express'
      },
      {
        id: 'debit_card',
        name: 'Debit Card',
        type: 'CARD',
        isActive: true,
        description: 'Pay with your debit card'
      },
      {
        id: 'paypal',
        name: 'PayPal',
        type: 'DIGITAL_WALLET',
        isActive: true,
        description: 'Pay with your PayPal account'
      },
      {
        id: 'stripe',
        name: 'Stripe',
        type: 'DIGITAL_WALLET',
        isActive: true,
        description: 'Secure payment processing'
      },
      {
        id: 'bank_transfer',
        name: 'Bank Transfer',
        type: 'BANK_TRANSFER',
        isActive: true,
        description: 'Direct bank transfer'
      }
    ];

    res.json({
      success: true,
      data: paymentMethods,
      message: 'Payment methods retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting payment methods:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment methods',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/v1/payment/initialize:
 *   post:
 *     summary: Initialize a payment
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - paymentMethod
 *               - amount
 *             properties:
 *               orderId:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Payment initialized successfully
 */
const initializePayment = async (req, res) => {
  try {
    const { orderId, paymentMethod, amount } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!orderId || !paymentMethod || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Order ID, payment method, and amount are required'
      });
    }

    // Check if order exists and belongs to user
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: userId
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        orderId: orderId,
        userId: userId,
        amount: amount,
        method: paymentMethod,
        status: 'PENDING',
        transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
    });

    // In a real application, you would integrate with payment gateways here
    // For now, we'll simulate payment initialization
    const paymentData = {
      paymentId: payment.id,
      transactionId: payment.transactionId,
      amount: payment.amount,
      method: payment.method,
      status: payment.status,
      redirectUrl: `/payment/process/${payment.id}`,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
    };

    res.json({
      success: true,
      data: paymentData,
      message: 'Payment initialized successfully'
    });
  } catch (error) {
    console.error('Error initializing payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize payment',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/v1/payment/{paymentId}/status:
 *   get:
 *     summary: Get payment status
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment status retrieved successfully
 */
const getPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user.id;

    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        userId: userId
      },
      include: {
        order: true
      }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: payment.id,
        transactionId: payment.transactionId,
        amount: payment.amount,
        method: payment.method,
        status: payment.status,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
        order: {
          id: payment.order.id,
          orderNumber: payment.order.orderNumber,
          status: payment.order.status
        }
      },
      message: 'Payment status retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment status',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/v1/payment/callback:
 *   post:
 *     summary: Process payment callback
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentId
 *               - status
 *             properties:
 *               paymentId:
 *                 type: string
 *               status:
 *                 type: string
 *               transactionId:
 *                 type: string
 *               signature:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment callback processed successfully
 */
const processPaymentCallback = async (req, res) => {
  try {
    const { paymentId, status, transactionId, signature } = req.body;

    // Validate required fields
    if (!paymentId || !status) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID and status are required'
      });
    }

    // Find payment
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Update payment status
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: status.toUpperCase(),
        transactionId: transactionId || payment.transactionId,
        updatedAt: new Date()
      }
    });

    // Update order status based on payment status
    if (status.toUpperCase() === 'COMPLETED') {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: { status: 'PAID' }
      });
    } else if (status.toUpperCase() === 'FAILED') {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: { status: 'PAYMENT_FAILED' }
      });
    }

    res.json({
      success: true,
      data: {
        paymentId: updatedPayment.id,
        status: updatedPayment.status,
        orderId: updatedPayment.orderId
      },
      message: 'Payment callback processed successfully'
    });
  } catch (error) {
    console.error('Error processing payment callback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payment callback',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/v1/payment/{paymentId}/refund:
 *   post:
 *     summary: Refund a payment
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Payment refunded successfully
 */
const refundPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { reason, amount } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Refund reason is required'
      });
    }

    // Find payment
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        userId: userId
      },
      include: { order: true }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Only completed payments can be refunded'
      });
    }

    // Create refund record
    const refundAmount = amount || payment.amount;
    const refund = await prisma.refund.create({
      data: {
        paymentId: paymentId,
        orderId: payment.orderId,
        userId: userId,
        amount: refundAmount,
        reason: reason,
        status: 'PENDING',
        refundId: `REF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
    });

    // Update payment status
    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'REFUNDED' }
    });

    // Update order status
    await prisma.order.update({
      where: { id: payment.orderId },
      data: { status: 'REFUNDED' }
    });

    res.json({
      success: true,
      data: {
        refundId: refund.id,
        paymentId: paymentId,
        amount: refundAmount,
        reason: reason,
        status: refund.status
      },
      message: 'Payment refunded successfully'
    });
  } catch (error) {
    console.error('Error refunding payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refund payment',
      error: error.message
    });
  }
};

module.exports = {
  getPaymentMethods,
  initializePayment,
  getPaymentStatus,
  processPaymentCallback,
  refundPayment
}; 