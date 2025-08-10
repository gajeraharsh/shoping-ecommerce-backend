/**
 * Product Variant Controller
 * Handles HTTP requests for product variant operations
 */

const variantService = require('./variant.service');
const { success, error } = require('../../utils/response');

/**
 * Create a new product variant
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createVariant = async (req, res) => {
  try {
    const variant = await variantService.createVariant(req.body, req.files);
    success(res, variant, 'Product variant created successfully', 201);
  } catch (err) {
    error(res, err.message, 400);
  }
};

/**
 * Get all variants for a product
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getVariantsByProduct = async (req, res) => {
  try {
    const variants = await variantService.getVariantsByProduct(req.params.productId);
    success(res, variants, 'Product variants retrieved successfully');
  } catch (err) {
    error(res, err.message, 400);
  }
};

/**
 * Get variant by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getVariantById = async (req, res) => {
  try {
    const variant = await variantService.getVariantById(req.params.id);
    if (!variant) {
      return error(res, 'Product variant not found', 404);
    }
    success(res, variant, 'Product variant retrieved successfully');
  } catch (err) {
    error(res, err.message, 400);
  }
};

/**
 * Update variant by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateVariant = async (req, res) => {
  try {
    const variant = await variantService.updateVariant(req.params.id, req.body, req.files);
    success(res, variant, 'Product variant updated successfully');
  } catch (err) {
    error(res, err.message, 400);
  }
};

/**
 * Soft delete variant by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteVariant = async (req, res) => {
  try {
    await variantService.deleteVariant(req.params.id);
    success(res, null, 'Product variant deleted successfully');
  } catch (err) {
    error(res, err.message, 400);
  }
};

/**
 * Hard delete variant by ID (Admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const hardDeleteVariant = async (req, res) => {
  try {
    await variantService.hardDeleteVariant(req.params.id, req.user.id);
    success(res, null, 'Product variant permanently deleted');
  } catch (err) {
    error(res, err.message, 400);
  }
};

module.exports = {
  createVariant,
  getVariantsByProduct,
  getVariantById,
  updateVariant,
  deleteVariant,
  hardDeleteVariant
};
