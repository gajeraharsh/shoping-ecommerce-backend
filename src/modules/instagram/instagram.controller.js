/**
 * Instagram Controller
 * Handles HTTP requests for Instagram reel operations
 */

const instagramService = require('./instagram.service');
const { success, error } = require('../../utils/response');

/**
 * Create a new Instagram reel (Admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createReel = async (req, res) => {
  try {
    const reel = await instagramService.createReel(req.body, req.files);
    success(res, reel, 'Instagram reel created successfully', 201);
  } catch (err) {
    error(res, err.message, 400);
  }
};

/**
 * Get all Instagram reels
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getReels = async (req, res) => {
  try {
    const result = await instagramService.getReels(req.query);
    success(res, result.data, 'Instagram reels retrieved successfully', 200, result.meta);
  } catch (err) {
    error(res, err.message, 400);
  }
};

/**
 * Get Instagram reel by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getReelById = async (req, res) => {
  try {
    const reel = await instagramService.getReelById(req.params.id);
    if (!reel) {
      return error(res, 'Instagram reel not found', 404);
    }
    success(res, reel, 'Instagram reel retrieved successfully');
  } catch (err) {
    error(res, err.message, 400);
  }
};

/**
 * Update Instagram reel by ID (Admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateReel = async (req, res) => {
  try {
    const reel = await instagramService.updateReel(req.params.id, req.body, req.files);
    success(res, reel, 'Instagram reel updated successfully');
  } catch (err) {
    error(res, err.message, 400);
  }
};

/**
 * Soft delete Instagram reel by ID (Admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteReel = async (req, res) => {
  try {
    await instagramService.deleteReel(req.params.id);
    success(res, null, 'Instagram reel deleted successfully');
  } catch (err) {
    error(res, err.message, 400);
  }
};

module.exports = {
  createReel,
  getReels,
  getReelById,
  updateReel,
  deleteReel
};
