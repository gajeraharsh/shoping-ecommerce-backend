/**
 * Category Controller
 * Handles HTTP requests for category endpoints
 */

const categoryService = require('./category.service');
const { success, paginated } = require('../../utils/response');
const { HTTP_STATUS, MESSAGES } = require('../../utils/constants');

/**
 * Create new category
 * @route POST /admin/categories
 */
const createCategory = async (req, res, next) => {
  try {
    const category = await categoryService.createCategory(req.body);
    success(res, category, MESSAGES.CREATED, HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all categories
 * @route GET /api/categories
 */
const getCategories = async (req, res, next) => {
  try {
    const result = await categoryService.getCategories(req.query);
    paginated(res, result.categories, result.meta, 'Categories retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get category by ID
 * @route GET /api/categories/:id
 */
const getCategoryById = async (req, res, next) => {
  try {
    const category = await categoryService.getCategoryById(
      parseInt(req.params.id),
      req.query.includeProducts === 'true'
    );
    success(res, category, 'Category retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update category
 * @route PUT /admin/categories/:id
 */
const updateCategory = async (req, res, next) => {
  try {
    const category = await categoryService.updateCategory(parseInt(req.params.id), req.body);
    success(res, category, MESSAGES.UPDATED);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete category
 * @route DELETE /admin/categories/:id
 */
const deleteCategory = async (req, res, next) => {
  try {
    const result = await categoryService.deleteCategory(parseInt(req.params.id));
    success(res, result, MESSAGES.DELETED);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
};
