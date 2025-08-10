/**
 * Wishlist Controller
 * Handles HTTP requests for wishlist operations
 */

const wishlistService = require('./wishlist.service');
const { success, error } = require('../../utils/response');

/**
 * Get user's wishlist
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getWishlist = async (req, res) => {
  try {
    const result = await wishlistService.getWishlist(req.user.id, req.query);
    success(res, result.data, 'Wishlist retrieved successfully', 200, result.meta);
  } catch (err) {
    error(res, err.message, 400);
  }
};

/**
 * Add product to wishlist
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const addToWishlist = async (req, res) => {
  try {
    const wishlistItem = await wishlistService.addToWishlist(req.user.id, req.body.productId);
    success(res, wishlistItem, 'Product added to wishlist successfully', 201);
  } catch (err) {
    error(res, err.message, 400);
  }
};

/**
 * Remove product from wishlist
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const removeFromWishlist = async (req, res) => {
  try {
    await wishlistService.removeFromWishlist(req.user.id, req.params.productId);
    success(res, null, 'Product removed from wishlist successfully');
  } catch (err) {
    error(res, err.message, 400);
  }
};

/**
 * Clear wishlist
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const clearWishlist = async (req, res) => {
  try {
    await wishlistService.clearWishlist(req.user.id);
    success(res, null, 'Wishlist cleared successfully');
  } catch (err) {
    error(res, err.message, 400);
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist
};
