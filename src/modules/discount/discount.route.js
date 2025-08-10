/**
 * Discount Routes
 * Defines API endpoints for discount operations
 */

const express = require('express');
const router = express.Router();
const discountController = require('./discount.controller');
const { authenticate, requireRole } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const discountValidation = require('./discount.validation');

/**
 * @swagger
 * components:
 *   schemas:
 *     Discount:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Discount ID
 *         code:
 *           type: string
 *           description: Discount code
 *         description:
 *           type: string
 *           description: Discount description
 *         type:
 *           type: string
 *           enum: [PERCENTAGE, FIXED]
 *         value:
 *           type: number
 *           description: Discount value
 *         minOrderAmount:
 *           type: number
 *           description: Minimum order amount
 *         maxDiscountAmount:
 *           type: number
 *           description: Maximum discount amount
 *         usageLimit:
 *           type: integer
 *           description: Usage limit
 *         usedCount:
 *           type: integer
 *           description: Used count
 *         isActive:
 *           type: boolean
 *           description: Is active
 *         validFrom:
 *           type: string
 *           format: date-time
 *         validTo:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/discounts:
 *   get:
 *     summary: Get all discounts
 *     tags: [Discounts]
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
 *         name: isActive
 *         schema:
 *           type: string
 *           enum: [true, false]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [PERCENTAGE, FIXED]
 *     responses:
 *       200:
 *         description: Discounts retrieved successfully
 */
router.get('/', 
  validate(discountValidation.getDiscountsSchema, 'query'),
  discountController.getDiscounts
);

/**
 * @swagger
 * /api/discounts/validate/{code}:
 *   get:
 *     summary: Validate discount code
 *     tags: [Discounts]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Discount code
 *     responses:
 *       200:
 *         description: Discount code is valid
 *       400:
 *         description: Invalid or expired discount code
 */
router.get('/validate/:code', 
  validate(discountValidation.validateDiscountCodeSchema, 'params'),
  discountController.validateDiscountCode
);

/**
 * @swagger
 * /api/discounts/{id}:
 *   get:
 *     summary: Get discount by ID
 *     tags: [Discounts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Discount ID
 *     responses:
 *       200:
 *         description: Discount retrieved successfully
 *       404:
 *         description: Discount not found
 */
router.get('/:id', 
  validate(discountValidation.getDiscountByIdSchema, 'params'),
  discountController.getDiscountById
);

/**
 * @swagger
 * /api/discounts:
 *   post:
 *     summary: Create a new discount (Admin only)
 *     tags: [Discounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - description
 *               - type
 *               - value
 *             properties:
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [PERCENTAGE, FIXED]
 *               value:
 *                 type: number
 *               minOrderAmount:
 *                 type: number
 *               maxDiscountAmount:
 *                 type: number
 *               usageLimit:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *               validFrom:
 *                 type: string
 *                 format: date-time
 *               validTo:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Discount created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post('/', 
  authenticate, 
  requireRole('ADMIN'),
  validate(discountValidation.createDiscountSchema, 'body'),
  discountController.createDiscount
);

/**
 * @swagger
 * /api/discounts/{id}:
 *   put:
 *     summary: Update discount by ID (Admin only)
 *     tags: [Discounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Discount ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [PERCENTAGE, FIXED]
 *               value:
 *                 type: number
 *               minOrderAmount:
 *                 type: number
 *               maxDiscountAmount:
 *                 type: number
 *               usageLimit:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *               validFrom:
 *                 type: string
 *                 format: date-time
 *               validTo:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Discount updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Discount not found
 */
router.put('/:id', 
  authenticate, 
  requireRole('ADMIN'),
  validate(discountValidation.updateDiscountSchema, 'body'),
  validate(discountValidation.getDiscountByIdSchema, 'params'),
  discountController.updateDiscount
);

/**
 * @swagger
 * /api/discounts/{id}:
 *   delete:
 *     summary: Soft delete discount by ID (Admin only)
 *     tags: [Discounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Discount ID
 *     responses:
 *       200:
 *         description: Discount deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Discount not found
 */
router.delete('/:id', 
  authenticate, 
  requireRole('ADMIN'),
  validate(discountValidation.getDiscountByIdSchema, 'params'),
  discountController.deleteDiscount
);

module.exports = router;
