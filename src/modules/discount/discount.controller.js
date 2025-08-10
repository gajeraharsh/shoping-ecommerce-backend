/**
 * Discount Controller
 * Handles HTTP requests for discount operations
 */

const discountService = require('./discount.service');
const { success, error } = require('../../utils/response');

/**
 * Create a new discount (Admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createDiscount = async (req, res) => {
  try {
    const discount = await discountService.createDiscount(req.body);
    success(res, discount, 'Discount created successfully', 201);
  } catch (err) {
    error(res, err.message, 400);
  }
};

/**
 * Get all discounts
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getDiscounts = async (req, res) => {
  try {
    const result = await discountService.getDiscounts(req.query);
    success(res, result.data, 'Discounts retrieved successfully', 200, result.meta);
  } catch (err) {
    error(res, err.message, 400);
  }
};

/**
 * Get discount by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getDiscountById = async (req, res) => {
  try {
    const discount = await discountService.getDiscountById(req.params.id);
    if (!discount) {
      return error(res, 'Discount not found', 404);
    }
    success(res, discount, 'Discount retrieved successfully');
  } catch (err) {
    error(res, err.message, 400);
  }
};

/**
 * Validate discount code
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const validateDiscountCode = async (req, res) => {
  try {
    const discount = await discountService.validateDiscountCode(req.params.code);
    success(res, discount, 'Discount code is valid');
  } catch (err) {
    error(res, err.message, 400);
  }
};

/**
 * Update discount by ID (Admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateDiscount = async (req, res) => {
  try {
    const discount = await discountService.updateDiscount(req.params.id, req.body);
    success(res, discount, 'Discount updated successfully');
  } catch (err) {
    error(res, err.message, 400);
  }
};

/**
 * Soft delete discount by ID (Admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteDiscount = async (req, res) => {
  try {
    await discountService.deleteDiscount(req.params.id);
    success(res, null, 'Discount deleted successfully');
  } catch (err) {
    error(res, err.message, 400);
  }
};

module.exports = {
  createDiscount,
  getDiscounts,
  getDiscountById,
  validateDiscountCode,
  updateDiscount,
  deleteDiscount
};
