/**
 * Instagram Routes
 * Defines API endpoints for Instagram reel operations
 */

const express = require('express');
const router = express.Router();
const instagramController = require('./instagram.controller');
const { authenticate, requireRole } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { upload } = require('../../utils/upload');
const instagramValidation = require('./instagram.validation');

/**
 * @swagger
 * components:
 *   schemas:
 *     InstagramReel:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Reel ID
 *         title:
 *           type: string
 *           description: Reel title
 *         description:
 *           type: string
 *           description: Reel description
 *         videoUrl:
 *           type: string
 *           description: Video URL
 *         thumbnail:
 *           type: string
 *           description: Thumbnail image URL
 *         instagramUrl:
 *           type: string
 *           description: Original Instagram URL
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Tags array
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
 * /api/instagram:
 *   get:
 *     summary: Get all Instagram reels
 *     tags: [Instagram]
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
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: createdAt:desc
 *     responses:
 *       200:
 *         description: Instagram reels retrieved successfully
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
 *                     $ref: '#/components/schemas/InstagramReel'
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
  validate(instagramValidation.getReelsSchema, 'query'),
  instagramController.getReels
);

/**
 * @swagger
 * /api/instagram/{id}:
 *   get:
 *     summary: Get Instagram reel by ID
 *     tags: [Instagram]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Reel ID
 *     responses:
 *       200:
 *         description: Instagram reel retrieved successfully
 *       404:
 *         description: Instagram reel not found
 */
router.get('/:id', 
  validate(instagramValidation.getReelByIdSchema, 'params'),
  instagramController.getReelById
);

/**
 * @swagger
 * /api/instagram:
 *   post:
 *     summary: Create a new Instagram reel (Admin only)
 *     tags: [Instagram]
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
 *               - video
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               instagramUrl:
 *                 type: string
 *               tags:
 *                 type: string
 *                 description: JSON string array of tags
 *               isActive:
 *                 type: boolean
 *               video:
 *                 type: string
 *                 format: binary
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Instagram reel created successfully
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
  upload.fields([{ name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]),
  validate(instagramValidation.createReelSchema, 'body'),
  instagramController.createReel
);

/**
 * @swagger
 * /api/instagram/{id}:
 *   put:
 *     summary: Update Instagram reel by ID (Admin only)
 *     tags: [Instagram]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Reel ID
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
 *               instagramUrl:
 *                 type: string
 *               tags:
 *                 type: string
 *                 description: JSON string array of tags
 *               isActive:
 *                 type: boolean
 *               video:
 *                 type: string
 *                 format: binary
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Instagram reel updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Instagram reel not found
 */
router.put('/:id', 
  authenticate, 
  requireRole('ADMIN'),
  upload.fields([{ name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]),
  validate(instagramValidation.updateReelSchema, 'body'),
  validate(instagramValidation.getReelByIdSchema, 'params'),
  instagramController.updateReel
);

/**
 * @swagger
 * /api/instagram/{id}:
 *   delete:
 *     summary: Soft delete Instagram reel by ID (Admin only)
 *     tags: [Instagram]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Reel ID
 *     responses:
 *       200:
 *         description: Instagram reel deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Instagram reel not found
 */
router.delete('/:id', 
  authenticate, 
  requireRole('ADMIN'),
  validate(instagramValidation.getReelByIdSchema, 'params'),
  instagramController.deleteReel
);

module.exports = router;
