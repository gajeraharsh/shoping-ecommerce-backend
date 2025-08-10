/**
 * Feed Routes
 * Defines API endpoints for feed section operations
 */

const express = require('express');
const router = express.Router();
const feedController = require('./feed.controller');
const { authenticate, requireRole } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { upload } = require('../../utils/upload');
const feedValidation = require('./feed.validation');

/**
 * @swagger
 * components:
 *   schemas:
 *     FeedSection:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Feed section ID
 *         title:
 *           type: string
 *           description: Section title
 *         description:
 *           type: string
 *           description: Section description
 *         bannerImage:
 *           type: string
 *           description: Banner image URL
 *         linkUrl:
 *           type: string
 *           description: Link URL
 *         order:
 *           type: integer
 *           description: Display order
 *         isActive:
 *           type: boolean
 *           description: Is active
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/feed:
 *   get:
 *     summary: Get all feed sections
 *     tags: [Feed]
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
 *         name: sort
 *         schema:
 *           type: string
 *           default: order:asc
 *     responses:
 *       200:
 *         description: Feed sections retrieved successfully
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
 *                     $ref: '#/components/schemas/FeedSection'
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
 */
router.get('/', 
  validate(feedValidation.getFeedSectionsSchema, 'query'),
  feedController.getFeedSections
);

/**
 * @swagger
 * /api/feed/{id}:
 *   get:
 *     summary: Get feed section by ID
 *     tags: [Feed]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Feed section ID
 *     responses:
 *       200:
 *         description: Feed section retrieved successfully
 *       404:
 *         description: Feed section not found
 */
router.get('/:id', 
  validate(feedValidation.getFeedSectionByIdSchema, 'params'),
  feedController.getFeedSectionById
);

/**
 * @swagger
 * /api/feed:
 *   post:
 *     summary: Create a new feed section (Admin only)
 *     tags: [Feed]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               linkUrl:
 *                 type: string
 *               order:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *               bannerImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Feed section created successfully
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
  upload.single('bannerImage'),
  validate(feedValidation.createFeedSectionSchema, 'body'),
  feedController.createFeedSection
);

/**
 * @swagger
 * /api/feed/{id}:
 *   put:
 *     summary: Update feed section by ID (Admin only)
 *     tags: [Feed]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Feed section ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               linkUrl:
 *                 type: string
 *               order:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *               bannerImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Feed section updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Feed section not found
 */
router.put('/:id', 
  authenticate, 
  requireRole('ADMIN'),
  upload.single('bannerImage'),
  validate(feedValidation.updateFeedSectionSchema, 'body'),
  validate(feedValidation.getFeedSectionByIdSchema, 'params'),
  feedController.updateFeedSection
);

/**
 * @swagger
 * /api/feed/{id}:
 *   delete:
 *     summary: Soft delete feed section by ID (Admin only)
 *     tags: [Feed]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Feed section ID
 *     responses:
 *       200:
 *         description: Feed section deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Feed section not found
 */
router.delete('/:id', 
  authenticate, 
  requireRole('ADMIN'),
  validate(feedValidation.getFeedSectionByIdSchema, 'params'),
  feedController.deleteFeedSection
);

module.exports = router;
