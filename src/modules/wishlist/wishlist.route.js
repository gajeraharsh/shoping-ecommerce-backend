/**
 * Wishlist Routes
 * Defines API endpoints for wishlist operations
 */

const express = require('express');
const router = express.Router();
const wishlistController = require('./wishlist.controller');
const { authenticate } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const wishlistValidation = require('./wishlist.validation');

/**
 * @swagger
 * components:
 *   schemas:
 *     Wishlist:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Wishlist item ID
 *         userId:
 *           type: integer
 *           description: User ID
 *         productId:
 *           type: integer
 *           description: Product ID
 *         createdAt:
 *           type: string
 *           format: date-time
 *         product:
 *           $ref: '#/components/schemas/Product'
 */

/**
 * @swagger
 * /api/wishlist:
 *   get:
 *     summary: Get user's wishlist
 *     tags: [Wishlist]
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
 *         name: sort
 *         schema:
 *           type: string
 *           default: createdAt:desc
 *     responses:
 *       200:
 *         description: Wishlist retrieved successfully
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
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Wishlist'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 */
router.get('/', 
  authenticate, 
  validate(wishlistValidation.getWishlistSchema, 'query'),
  wishlistController.getWishlist
);

/**
 * @swagger
 * /api/wishlist:
 *   post:
 *     summary: Add product to wishlist
 *     tags: [Wishlist]
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
 *             properties:
 *               productId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Product added to wishlist successfully
 *       400:
 *         description: Product already in wishlist or not found
 *       401:
 *         description: Unauthorized
 */
router.post('/', 
  authenticate, 
  validate(wishlistValidation.addToWishlistSchema, 'body'),
  wishlistController.addToWishlist
);

/**
 * @swagger
 * /api/wishlist/{productId}:
 *   delete:
 *     summary: Remove product from wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product removed from wishlist successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found in wishlist
 */
router.delete('/:productId', 
  authenticate, 
  validate(wishlistValidation.removeFromWishlistSchema, 'params'),
  wishlistController.removeFromWishlist
);

/**
 * @swagger
 * /api/wishlist/clear:
 *   delete:
 *     summary: Clear wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wishlist cleared successfully
 *       401:
 *         description: Unauthorized
 */
router.delete('/clear', authenticate, wishlistController.clearWishlist);

module.exports = router;
