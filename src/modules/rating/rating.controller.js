/**
 * Rating Controller
 * Handles HTTP requests for product rating operations
 */

const ratingService = require('./rating.service');
const { success, error } = require('../../utils/response');

/**
 * Create a new product rating
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createRating = async (req, res) => {
  try {
    const rating = await ratingService.createRating(req.user.id, req.body);
    success(res, rating, 'Rating created successfully', 201);
  } catch (err) {
    error(res, err.message, 400);
  }
};

/**
 * Get ratings for a product
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getProductRatings = async (req, res) => {
  try {
    const result = await ratingService.getProductRatings(req.params.productId, req.query);
    success(res, result.data, 'Product ratings retrieved successfully', 200, result.meta);
  } catch (err) {
    error(res, err.message, 400);
  }
};

/**
 * Get user's ratings
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserRatings = async (req, res) => {
  try {
    const result = await ratingService.getUserRatings(req.user.id, req.query);
    success(res, result.data, 'User ratings retrieved successfully', 200, result.meta);
  } catch (err) {
    error(res, err.message, 400);
  }
};

/**
 * Get rating by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getRatingById = async (req, res) => {
  try {
    const rating = await ratingService.getRatingById(req.params.id, req.user);
    if (!rating) {
      return error(res, 'Rating not found', 404);
    }
    success(res, rating, 'Rating retrieved successfully');
  } catch (err) {
    error(res, err.message, 400);
  }
};

/**
 * Update rating by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateRating = async (req, res) => {
  try {
    const rating = await ratingService.updateRating(req.params.id, req.user.id, req.body, req.user.role);
    success(res, rating, 'Rating updated successfully');
  } catch (err) {
    error(res, err.message, 400);
  }
};

/**
 * Soft delete rating by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteRating = async (req, res) => {
  try {
    await ratingService.deleteRating(req.params.id, req.user.id, req.user.role);
    success(res, null, 'Rating deleted successfully');
  } catch (err) {
    error(res, err.message, 400);
  }
};

module.exports = {
  createRating,
  getProductRatings,
  getUserRatings,
  getRatingById,
  updateRating,
  deleteRating
};
