/**
 * Rating Routes
 * Defines API endpoints for product rating operations
 */

const express = require('express');
const router = express.Router();
const ratingController = require('./rating.controller');
const { authenticate, requireRole } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const ratingValidation = require('./rating.validation');

/**
 * @swagger
 * components:
 *   schemas:
 *     ProductRating:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Rating ID
 *         userId:
 *           type: integer
 *           description: User ID
 *         productId:
 *           type: integer
 *           description: Product ID
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Rating value (1-5)
 *         comment:
 *           type: string
 *           description: Rating comment
 *         createdAt:
 *           type: string
 *           format: date-time
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             name:
 *               type: string
 *             email:
 *               type: string
 *         product:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             name:
 *               type: string
 *             slug:
 *               type: string
 */

/**
 * @swagger
 * /api/ratings/product/{productId}:
 *   get:
 *     summary: Get ratings for a product
 *     tags: [Ratings]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
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
 *         name: rating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: Filter by rating value
 *     responses:
 *       200:
 *         description: Product ratings retrieved successfully
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
 *                     $ref: '#/components/schemas/ProductRating'
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
 *                     averageRating:
 *                       type: number
 *                     totalRatings:
 *                       type: integer
 */
router.get('/product/:productId', 
  validate(ratingValidation.getProductRatingsSchema, 'params'),
  validate(ratingValidation.getRatingsQuerySchema, 'query'),
  ratingController.getProductRatings
);

/**
 * @swagger
 * /api/ratings/my:
 *   get:
 *     summary: Get user's ratings
 *     tags: [Ratings]
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
 *     responses:
 *       200:
 *         description: User ratings retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/my', 
  authenticate,
  validate(ratingValidation.getRatingsQuerySchema, 'query'),
  ratingController.getUserRatings
);

/**
 * @swagger
 * /api/ratings/{id}:
 *   get:
 *     summary: Get rating by ID
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Rating ID
 *     responses:
 *       200:
 *         description: Rating retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Rating not found
 */
router.get('/:id', 
  authenticate,
  validate(ratingValidation.getRatingByIdSchema, 'params'),
  ratingController.getRatingById
);

/**
 * @swagger
 * /api/ratings:
 *   post:
 *     summary: Create a new product rating
 *     tags: [Ratings]
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
 *               - rating
 *             properties:
 *               productId:
 *                 type: integer
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Rating created successfully
 *       400:
 *         description: Validation error or already rated
 *       401:
 *         description: Unauthorized
 */
router.post('/', 
  authenticate,
  validate(ratingValidation.createRatingSchema, 'body'),
  ratingController.createRating
);

/**
 * @swagger
 * /api/ratings/{id}:
 *   put:
 *     summary: Update rating by ID
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Rating ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Rating updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Rating not found
 */
router.put('/:id', 
  authenticate,
  validate(ratingValidation.updateRatingSchema, 'body'),
  validate(ratingValidation.getRatingByIdSchema, 'params'),
  ratingController.updateRating
);

/**
 * @swagger
 * /api/ratings/{id}:
 *   delete:
 *     summary: Delete rating by ID
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Rating ID
 *     responses:
 *       200:
 *         description: Rating deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Rating not found
 */
router.delete('/:id', 
  authenticate,
  validate(ratingValidation.getRatingByIdSchema, 'params'),
  ratingController.deleteRating
);

module.exports = router;
