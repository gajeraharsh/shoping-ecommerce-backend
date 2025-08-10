/**
 * Feed Controller
 * Handles HTTP requests for feed section operations
 */

const feedService = require('./feed.service');
const { success, error } = require('../../utils/response');

/**
 * Create a new feed section (Admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createFeedSection = async (req, res) => {
  try {
    const feedSection = await feedService.createFeedSection(req.body, req.file);
    success(res, feedSection, 'Feed section created successfully', 201);
  } catch (err) {
    error(res, err.message, 400);
  }
};

/**
 * Get all feed sections
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getFeedSections = async (req, res) => {
  try {
    const result = await feedService.getFeedSections(req.query);
    success(res, result.data, 'Feed sections retrieved successfully', 200, result.meta);
  } catch (err) {
    error(res, err.message, 400);
  }
};

/**
 * Get feed section by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getFeedSectionById = async (req, res) => {
  try {
    const feedSection = await feedService.getFeedSectionById(req.params.id);
    if (!feedSection) {
      return error(res, 'Feed section not found', 404);
    }
    success(res, feedSection, 'Feed section retrieved successfully');
  } catch (err) {
    error(res, err.message, 400);
  }
};

/**
 * Update feed section by ID (Admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateFeedSection = async (req, res) => {
  try {
    const feedSection = await feedService.updateFeedSection(req.params.id, req.body, req.file);
    success(res, feedSection, 'Feed section updated successfully');
  } catch (err) {
    error(res, err.message, 400);
  }
};

/**
 * Soft delete feed section by ID (Admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteFeedSection = async (req, res) => {
  try {
    await feedService.deleteFeedSection(req.params.id);
    success(res, null, 'Feed section deleted successfully');
  } catch (err) {
    error(res, err.message, 400);
  }
};

module.exports = {
  createFeedSection,
  getFeedSections,
  getFeedSectionById,
  updateFeedSection,
  deleteFeedSection
};
