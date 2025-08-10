/**
 * Blog Routes
 * Defines API endpoints for blog operations
 */

const express = require('express');
const router = express.Router();
const blogController = require('./blog.controller');
const { authenticate, requireRole } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { upload } = require('../../utils/upload');
const blogValidation = require('./blog.validation');

/**
 * @swagger
 * components:
 *   schemas:
 *     BlogPost:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Blog post ID
 *         title:
 *           type: string
 *           description: Post title
 *         slug:
 *           type: string
 *           description: Post slug
 *         excerpt:
 *           type: string
 *           description: Post excerpt
 *         content:
 *           type: string
 *           description: Post content
 *         coverImage:
 *           type: string
 *           description: Cover image URL
 *         published:
 *           type: boolean
 *           description: Published status
 *         publishedAt:
 *           type: string
 *           format: date-time
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         author:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             name:
 *               type: string
 *             email:
 *               type: string
 *         category:
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
 * /api/blog:
 *   get:
 *     summary: Get all blog posts
 *     tags: [Blog]
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
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: published
 *         schema:
 *           type: string
 *           enum: [true, false]
 *     responses:
 *       200:
 *         description: Blog posts retrieved successfully
 */
router.get('/', 
  validate(blogValidation.getBlogPostsSchema, 'query'),
  blogController.getBlogPosts
);

/**
 * @swagger
 * /api/blog/{id}:
 *   get:
 *     summary: Get blog post by ID or slug
 *     tags: [Blog]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID or slug
 *     responses:
 *       200:
 *         description: Blog post retrieved successfully
 *       404:
 *         description: Blog post not found
 */
router.get('/:id', 
  validate(blogValidation.getBlogPostByIdSchema, 'params'),
  blogController.getBlogPostById
);

/**
 * @swagger
 * /api/blog/{id}/comments:
 *   get:
 *     summary: Get comments for a blog post
 *     tags: [Blog]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Post ID
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
 *         description: Comments retrieved successfully
 */
router.get('/:id/comments', 
  validate(blogValidation.getCommentsSchema, 'query'),
  validate(blogValidation.getBlogPostByIdSchema, 'params'),
  blogController.getComments
);

/**
 * @swagger
 * /api/blog:
 *   post:
 *     summary: Create a new blog post (Admin only)
 *     tags: [Blog]
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
 *               - content
 *               - categoryId
 *             properties:
 *               title:
 *                 type: string
 *               slug:
 *                 type: string
 *               excerpt:
 *                 type: string
 *               content:
 *                 type: string
 *               categoryId:
 *                 type: integer
 *               tags:
 *                 type: string
 *               published:
 *                 type: boolean
 *               coverImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Blog post created successfully
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
  upload.single('coverImage'),
  validate(blogValidation.createBlogPostSchema, 'body'),
  blogController.createBlogPost
);

/**
 * @swagger
 * /api/blog/{id}:
 *   put:
 *     summary: Update blog post by ID (Admin only)
 *     tags: [Blog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Post ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               slug:
 *                 type: string
 *               excerpt:
 *                 type: string
 *               content:
 *                 type: string
 *               categoryId:
 *                 type: integer
 *               tags:
 *                 type: string
 *               published:
 *                 type: boolean
 *               coverImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Blog post updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Blog post not found
 */
router.put('/:id', 
  authenticate, 
  requireRole('ADMIN'),
  upload.single('coverImage'),
  validate(blogValidation.updateBlogPostSchema, 'body'),
  validate(blogValidation.getBlogPostByIdSchema, 'params'),
  blogController.updateBlogPost
);

/**
 * @swagger
 * /api/blog/{id}:
 *   delete:
 *     summary: Soft delete blog post by ID (Admin only)
 *     tags: [Blog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Blog post deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Blog post not found
 */
router.delete('/:id', 
  authenticate, 
  requireRole('ADMIN'),
  validate(blogValidation.getBlogPostByIdSchema, 'params'),
  blogController.deleteBlogPost
);

/**
 * @swagger
 * /api/blog/{id}/comments:
 *   post:
 *     summary: Add comment to blog post
 *     tags: [Blog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Post ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment added successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Blog post not found
 */
router.post('/:id/comments', 
  authenticate,
  validate(blogValidation.addCommentSchema, 'body'),
  validate(blogValidation.getBlogPostByIdSchema, 'params'),
  blogController.addComment
);

module.exports = router;
