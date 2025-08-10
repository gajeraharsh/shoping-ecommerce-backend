/**
 * Order Routes
 * Defines API endpoints for order operations
 */

const express = require('express');
const router = express.Router();
const orderController = require('./order.controller');
const { authenticate, requireRole, requireSelfOrAdmin } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const orderValidation = require('./order.validation');

/**
 * @swagger
 * components:
 *   schemas:
 *     Order:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Order ID
 *         userId:
 *           type: integer
 *           description: User ID
 *         totalAmount:
 *           type: number
 *           description: Total order amount
 *         status:
 *           type: string
 *           enum: [PENDING, COMPLETED, CANCELLED]
 *         email:
 *           type: string
 *         phone:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               productId:
 *                 type: integer
 *               variantId:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *               price:
 *                 type: number
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order (checkout)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - addressId
 *               - email
 *               - phone
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: integer
 *                     variantId:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *               addressId:
 *                 type: integer
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               discountId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Validation error or insufficient stock
 *       401:
 *         description: Unauthorized
 */
router.post('/', 
  authenticate, 
  validate(orderValidation.createOrderSchema, 'body'), 
  orderController.createOrder
);

/**
 * @swagger
 * /api/orders/my:
 *   get:
 *     summary: Get current user's orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, COMPLETED, CANCELLED]
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 */
router.get('/my', 
  authenticate, 
  validate(orderValidation.getOrdersSchema, 'query'),
  orderController.getUserOrders
);

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get all orders (Admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, COMPLETED, CANCELLED]
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/', 
  authenticate, 
  requireRole('ADMIN'),
  validate(orderValidation.getOrdersSchema, 'query'),
  orderController.getAllOrders
);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *       404:
 *         description: Order not found
 */
router.get('/:id', 
  authenticate, 
  validate(orderValidation.getOrderByIdSchema, 'params'),
  orderController.getOrderById
);

/**
 * @swagger
 * /api/orders/{id}/status:
 *   put:
 *     summary: Update order status (Admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, COMPLETED, CANCELLED]
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Order not found
 */
router.put('/:id/status', 
  authenticate, 
  requireRole('ADMIN'),
  validate(orderValidation.updateOrderStatusSchema, 'body'),
  validate(orderValidation.getOrderByIdSchema, 'params'),
  orderController.updateOrderStatus
);

/**
 * @swagger
 * /api/orders/{id}/cancel:
 *   put:
 *     summary: Cancel order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *       400:
 *         description: Cannot cancel order
 *       404:
 *         description: Order not found
 */
router.put('/:id/cancel', 
  authenticate, 
  validate(orderValidation.getOrderByIdSchema, 'params'),
  orderController.cancelOrder
);

/**
 * @swagger
 * /api/orders/{id}:
 *   delete:
 *     summary: Soft delete order (Admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Order deleted successfully
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Order not found
 */
router.delete('/:id', 
  authenticate, 
  requireRole('ADMIN'),
  validate(orderValidation.getOrderByIdSchema, 'params'),
  orderController.deleteOrder
);

module.exports = router;
