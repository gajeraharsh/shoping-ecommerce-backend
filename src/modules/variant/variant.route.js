/**
 * Product Variant Routes
 * Defines API endpoints for product variant operations
 */

const express = require('express');
const router = express.Router();
const variantController = require('./variant.controller');
const { authenticate, requireRole } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { upload } = require('../../utils/upload');
const variantValidation = require('./variant.validation');

/**
 * @swagger
 * components:
 *   schemas:
 *     ProductVariant:
 *       type: object
 *       required:
 *         - productId
 *         - price
 *       properties:
 *         id:
 *           type: integer
 *           description: Variant ID
 *         productId:
 *           type: integer
 *           description: Product ID
 *         sku:
 *           type: string
 *           description: Variant SKU
 *         size:
 *           type: string
 *           description: Size
 *         color:
 *           type: string
 *           description: Color
 *         price:
 *           type: number
 *           description: Variant price
 *         discountedPrice:
 *           type: number
 *           description: Discounted price
 *         stock:
 *           type: integer
 *           description: Stock quantity
 */

/**
 * @swagger
 * /api/variants/product/{productId}:
 *   get:
 *     summary: Get all variants for a product
 *     tags: [Product Variants]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product variants retrieved successfully
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
 *                     $ref: '#/components/schemas/ProductVariant'
 */
router.get('/product/:productId', 
  validate(variantValidation.getVariantsByProductSchema, 'params'), 
  variantController.getVariantsByProduct
);

/**
 * @swagger
 * /api/variants/{id}:
 *   get:
 *     summary: Get variant by ID
 *     tags: [Product Variants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Variant ID
 *     responses:
 *       200:
 *         description: Product variant retrieved successfully
 *       404:
 *         description: Product variant not found
 */
router.get('/:id', 
  validate(variantValidation.getVariantByIdSchema, 'params'), 
  variantController.getVariantById
);

/**
 * @swagger
 * /api/variants:
 *   post:
 *     summary: Create a new product variant (Admin only)
 *     tags: [Product Variants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - price
 *             properties:
 *               productId:
 *                 type: integer
 *               sku:
 *                 type: string
 *               size:
 *                 type: string
 *               color:
 *                 type: string
 *               price:
 *                 type: number
 *               discountedPrice:
 *                 type: number
 *               stock:
 *                 type: integer
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Product variant created successfully
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
  upload.array('images', 5),
  validate(variantValidation.createVariantSchema, 'body'), 
  variantController.createVariant
);

/**
 * @swagger
 * /api/variants/{id}:
 *   put:
 *     summary: Update variant by ID (Admin only)
 *     tags: [Product Variants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Variant ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: integer
 *               sku:
 *                 type: string
 *               size:
 *                 type: string
 *               color:
 *                 type: string
 *               price:
 *                 type: number
 *               discountedPrice:
 *                 type: number
 *               stock:
 *                 type: integer
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Product variant updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Product variant not found
 */
router.put('/:id', 
  authenticate, 
  requireRole('ADMIN'), 
  upload.array('images', 5),
  validate(variantValidation.updateVariantSchema, 'body'),
  validate(variantValidation.getVariantByIdSchema, 'params'),
  variantController.updateVariant
);

/**
 * @swagger
 * /api/variants/{id}:
 *   delete:
 *     summary: Soft delete variant by ID (Admin only)
 *     tags: [Product Variants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Variant ID
 *     responses:
 *       200:
 *         description: Product variant deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Product variant not found
 */
router.delete('/:id', 
  authenticate, 
  requireRole('ADMIN'), 
  validate(variantValidation.getVariantByIdSchema, 'params'),
  variantController.deleteVariant
);

/**
 * @swagger
 * /api/variants/{id}/hard:
 *   delete:
 *     summary: Hard delete variant by ID (Admin only)
 *     tags: [Product Variants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Variant ID
 *     responses:
 *       200:
 *         description: Product variant permanently deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Product variant not found
 */
router.delete('/:id/hard', 
  authenticate, 
  requireRole('ADMIN'), 
  validate(variantValidation.getVariantByIdSchema, 'params'),
  variantController.hardDeleteVariant
);

module.exports = router;
