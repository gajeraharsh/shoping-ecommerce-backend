/**
 * Product Controller
 * Handles HTTP requests for product operations
 */

const productService = require('./product.service');
const { success, error } = require('../../utils/response');

/**
 * Create a new product
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createProduct = async (req, res) => {
  try {
    const product = await productService.createProduct(req.body, req.files);
    success(res, product, 'Product created successfully', 201);
  } catch (err) {
    error(res, err.message, 400);
  }
};

/**
 * Get all products with pagination, filtering, and search
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getProducts = async (req, res) => {
  try {
    const result = await productService.getProducts(req.query);
    success(res, result.data, 'Products retrieved successfully', 200, result.meta);
  } catch (err) {
    error(res, err.message, 400);
  }
};

/**
 * Get product by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getProductById = async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);
    if (!product) {
      return error(res, 'Product not found', 404);
    }
    success(res, product, 'Product retrieved successfully');
  } catch (err) {
    error(res, err.message, 400);
  }
};

/**
 * Update product by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateProduct = async (req, res) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body, req.files);
    success(res, product, 'Product updated successfully');
  } catch (err) {
    error(res, err.message, 400);
  }
};

/**
 * Soft delete product by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteProduct = async (req, res) => {
  try {
    await productService.deleteProduct(req.params.id);
    success(res, null, 'Product deleted successfully');
  } catch (err) {
    error(res, err.message, 400);
  }
};

/**
 * Hard delete product by ID (Admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const hardDeleteProduct = async (req, res) => {
  try {
    await productService.hardDeleteProduct(req.params.id, req.user.id);
    success(res, null, 'Product permanently deleted');
  } catch (err) {
    error(res, err.message, 400);
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  hardDeleteProduct
};
