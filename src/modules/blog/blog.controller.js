/**
 * Blog Controller
 * Handles HTTP requests for blog operations
 */

const blogService = require('./blog.service');
const { success, error } = require('../../utils/response');

/**
 * Create a new blog post (Admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createBlogPost = async (req, res) => {
  try {
    const blogPost = await blogService.createBlogPost(req.body, req.user.id, req.file);
    success(res, blogPost, 'Blog post created successfully', 201);
  } catch (err) {
    error(res, err.message, 400);
  }
};

/**
 * Get all blog posts
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getBlogPosts = async (req, res) => {
  try {
    const result = await blogService.getBlogPosts(req.query);
    success(res, result.data, 'Blog posts retrieved successfully', 200, result.meta);
  } catch (err) {
    error(res, err.message, 400);
  }
};

/**
 * Get blog post by ID or slug
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getBlogPostById = async (req, res) => {
  try {
    const blogPost = await blogService.getBlogPostById(req.params.id);
    if (!blogPost) {
      return error(res, 'Blog post not found', 404);
    }
    success(res, blogPost, 'Blog post retrieved successfully');
  } catch (err) {
    error(res, err.message, 400);
  }
};

/**
 * Update blog post by ID (Admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateBlogPost = async (req, res) => {
  try {
    const blogPost = await blogService.updateBlogPost(req.params.id, req.body, req.file);
    success(res, blogPost, 'Blog post updated successfully');
  } catch (err) {
    error(res, err.message, 400);
  }
};

/**
 * Soft delete blog post by ID (Admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteBlogPost = async (req, res) => {
  try {
    await blogService.deleteBlogPost(req.params.id);
    success(res, null, 'Blog post deleted successfully');
  } catch (err) {
    error(res, err.message, 400);
  }
};

/**
 * Add comment to blog post
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const addComment = async (req, res) => {
  try {
    const comment = await blogService.addComment(req.params.id, req.user.id, req.body.content);
    success(res, comment, 'Comment added successfully', 201);
  } catch (err) {
    error(res, err.message, 400);
  }
};

/**
 * Get comments for a blog post
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getComments = async (req, res) => {
  try {
    const result = await blogService.getComments(req.params.id, req.query);
    success(res, result.data, 'Comments retrieved successfully', 200, result.meta);
  } catch (err) {
    error(res, err.message, 400);
  }
};

module.exports = {
  createBlogPost,
  getBlogPosts,
  getBlogPostById,
  updateBlogPost,
  deleteBlogPost,
  addComment,
  getComments
};
