/**
 * User Controller
 * Handles HTTP requests for user endpoints
 */

const userService = require('./user.service');
const { success, paginated } = require('../../utils/response');
const { HTTP_STATUS, MESSAGES } = require('../../utils/constants');

/**
 * Get current user profile
 * @route GET /api/profile
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await userService.getProfile(req.user.id);
    success(res, user, 'Profile retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update current user profile
 * @route PUT /api/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const user = await userService.updateProfile(req.user.id, req.body);
    success(res, user, MESSAGES.UPDATED);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users (admin only)
 * @route GET /admin/users
 */
const getUsers = async (req, res, next) => {
  try {
    const result = await userService.getUsers(req.query);
    paginated(res, result.users, result.meta, 'Users retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID (admin only)
 * @route GET /admin/users/:id
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(
      parseInt(req.params.id),
      req.query.includeDeleted
    );
    success(res, user, 'User retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update user (admin only)
 * @route PUT /admin/users/:id
 */
const updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(parseInt(req.params.id), req.body);
    success(res, user, MESSAGES.UPDATED);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user (admin only)
 * @route DELETE /admin/users/:id
 */
const deleteUser = async (req, res, next) => {
  try {
    const result = await userService.deleteUser(parseInt(req.params.id));
    success(res, result, MESSAGES.DELETED);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getUsers,
  getUserById,
  updateUser,
  deleteUser
};
