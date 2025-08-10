/**
 * Cart Controller
 * Handles HTTP requests for cart operations
 */

const cartService = require('./cart.service');
const { success, error } = require('../../utils/response');

/**
 * Get user's cart
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getCart = async (req, res) => {
  try {
    const cart = await cartService.getCart(req.user.id);
    success(res, cart, 'Cart retrieved successfully');
  } catch (err) {
    error(res, err.message, 400);
  }
};

/**
 * Add item to cart
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const addToCart = async (req, res) => {
  try {
    const cart = await cartService.addToCart(req.user.id, req.body);
    success(res, cart, 'Item added to cart successfully');
  } catch (err) {
    error(res, err.message, 400);
  }
};

/**
 * Update cart item quantity
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateCartItem = async (req, res) => {
  try {
    const cart = await cartService.updateCartItem(req.user.id, req.params.itemId, req.body.quantity);
    success(res, cart, 'Cart item updated successfully');
  } catch (err) {
    error(res, err.message, 400);
  }
};

/**
 * Remove item from cart
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const removeFromCart = async (req, res) => {
  try {
    const cart = await cartService.removeFromCart(req.user.id, req.params.itemId);
    success(res, cart, 'Item removed from cart successfully');
  } catch (err) {
    error(res, err.message, 400);
  }
};

/**
 * Clear cart
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const clearCart = async (req, res) => {
  try {
    await cartService.clearCart(req.user.id);
    success(res, null, 'Cart cleared successfully');
  } catch (err) {
    error(res, err.message, 400);
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
};
