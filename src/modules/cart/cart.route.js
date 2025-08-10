/**
 * Cart Routes
 * Defines API endpoints for cart operations
 */

const express = require('express');
const router = express.Router();
const cartController = require('./cart.controller');
const { authenticate } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const cartValidation = require('./cart.validation');

/**
 * @swagger
 * components:
 *   schemas:
 *     Cart:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Cart ID
 *         userId:
 *           type: integer
 *           description: User ID
 *         totalItems:
 *           type: integer
 *           description: Total number of items
 *         totalAmount:
 *           type: number
 *           description: Total cart amount
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *               productId:
 *                 type: integer
 *               variantId:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *               product:
 *                 $ref: '#/components/schemas/Product'
 *               variant:
 *                 $ref: '#/components/schemas/ProductVariant'
 */

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Get user's cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Cart'
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticate, cartController.getCart);

/**
 * @swagger
 * /api/cart/add:
 *   post:
 *     summary: Add item to cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - variantId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: integer
 *               variantId:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Item added to cart successfully
 *       400:
 *         description: Validation error or insufficient stock
 *       401:
 *         description: Unauthorized
 */
router.post('/add', 
  authenticate, 
  validate(cartValidation.addToCartSchema, 'body'), 
  cartController.addToCart
);

/**
 * @swagger
 * /api/cart/items/{itemId}:
 *   put:
 *     summary: Update cart item quantity
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Cart item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Cart item updated successfully
 *       400:
 *         description: Validation error or insufficient stock
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Cart item not found
 */
router.put('/items/:itemId', 
  authenticate, 
  validate(cartValidation.updateCartItemSchema, 'body'),
  validate(cartValidation.cartItemIdSchema, 'params'),
  cartController.updateCartItem
);

/**
 * @swagger
 * /api/cart/items/{itemId}:
 *   delete:
 *     summary: Remove item from cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Cart item ID
 *     responses:
 *       200:
 *         description: Item removed from cart successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Cart item not found
 */
router.delete('/items/:itemId', 
  authenticate, 
  validate(cartValidation.cartItemIdSchema, 'params'),
  cartController.removeFromCart
);

/**
 * @swagger
 * /api/cart/clear:
 *   delete:
 *     summary: Clear cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared successfully
 *       401:
 *         description: Unauthorized
 */
router.delete('/clear', authenticate, cartController.clearCart);

module.exports = router;
