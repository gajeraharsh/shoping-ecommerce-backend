/**
 * Order Controller
 * Handles HTTP requests for order operations
 */

const orderService = require('./order.service');
const { success, error } = require('../../utils/response');

/**
 * Create a new order (checkout)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createOrder = async (req, res) => {
  try {
    const order = await orderService.createOrder(req.user.id, req.body);
    success(res, order, 'Order created successfully', 201);
  } catch (err) {
    error(res, err.message, 400);
  }
};

/**
 * Get user's orders
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserOrders = async (req, res) => {
  try {
    const result = await orderService.getUserOrders(req.user.id, req.query);
    success(res, result.data, 'Orders retrieved successfully', 200, result.meta);
  } catch (err) {
    error(res, err.message, 400);
  }
};

/**
 * Get all orders (Admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllOrders = async (req, res) => {
  try {
    const result = await orderService.getAllOrders(req.query);
    success(res, result.data, 'Orders retrieved successfully', 200, result.meta);
  } catch (err) {
    error(res, err.message, 400);
  }
};

/**
 * Get order by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getOrderById = async (req, res) => {
  try {
    const order = await orderService.getOrderById(req.params.id, req.user);
    if (!order) {
      return error(res, 'Order not found', 404);
    }
    success(res, order, 'Order retrieved successfully');
  } catch (err) {
    error(res, err.message, 400);
  }
};

/**
 * Update order status (Admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateOrderStatus = async (req, res) => {
  try {
    const order = await orderService.updateOrderStatus(req.params.id, req.body.status, req.body.note);
    success(res, order, 'Order status updated successfully');
  } catch (err) {
    error(res, err.message, 400);
  }
};

/**
 * Cancel order
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const cancelOrder = async (req, res) => {
  try {
    const order = await orderService.cancelOrder(req.params.id, req.user.id, req.user.role);
    success(res, order, 'Order cancelled successfully');
  } catch (err) {
    error(res, err.message, 400);
  }
};

/**
 * Soft delete order (Admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteOrder = async (req, res) => {
  try {
    await orderService.deleteOrder(req.params.id);
    success(res, null, 'Order deleted successfully');
  } catch (err) {
    error(res, err.message, 400);
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  deleteOrder
};
