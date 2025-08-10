/**
 * Category Routes
 * Defines routes for category endpoints with validation and middleware
 */

const express = require('express');
const categoryController = require('./category.controller');
const validate = require('../../middlewares/validate');
const { authenticate, requireAdmin, optionalAuth } = require('../../middlewares/auth');
const {
  createCategorySchema,
  updateCategorySchema,
  getCategoriesSchema,
  getCategoryByIdSchema,
  deleteCategorySchema
} = require('./category.validation');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         slug:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, name, slug]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 */
router.get('/', validate(getCategoriesSchema), categoryController.getCategories);

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: includeProducts
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: Category retrieved successfully
 *       404:
 *         description: Category not found
 */
router.get('/:id', validate(getCategoryByIdSchema), categoryController.getCategoryById);

// Admin routes
/**
 * @swagger
 * /admin/categories:
 *   post:
 *     summary: Create new category (admin only)
 *     tags: [Admin - Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - slug
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               slug:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 pattern: '^[a-z0-9-]+$'
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       409:
 *         description: Category slug already exists
 */
router.post('/', authenticate, requireAdmin, validate(createCategorySchema), categoryController.createCategory);

/**
 * @swagger
 * /admin/categories/{id}:
 *   put:
 *     summary: Update category (admin only)
 *     tags: [Admin - Categories]
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
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               slug:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 pattern: '^[a-z0-9-]+$'
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Category not found
 *       409:
 *         description: Category slug already exists
 */
router.put('/:id', authenticate, requireAdmin, validate(updateCategorySchema), categoryController.updateCategory);

/**
 * @swagger
 * /admin/categories/{id}:
 *   delete:
 *     summary: Delete category (admin only)
 *     tags: [Admin - Categories]
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
 *         description: Category deleted successfully
 *       400:
 *         description: Cannot delete category with existing products
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Category not found
 */
router.delete('/:id', authenticate, requireAdmin, validate(deleteCategorySchema), categoryController.deleteCategory);

module.exports = router;
