/**
 * Authentication Controller
 * Handles HTTP requests for authentication endpoints
 */

const authService = require('./auth.service');
const { success } = require('../../utils/response');
const { HTTP_STATUS, MESSAGES } = require('../../utils/constants');

/**
 * Register new user
 * @route POST /auth/register
 */
const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    success(res, result, MESSAGES.CREATED, HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * @route POST /auth/login
 */
const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    success(res, result, 'Login successful');
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token
 * @route POST /auth/refresh
 */
const refreshToken = async (req, res, next) => {
  try {
    const result = await authService.refreshToken(req.body.refreshToken);
    success(res, result, 'Token refreshed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Change password
 * @route POST /auth/change-password
 */
const changePassword = async (req, res, next) => {
  try {
    const result = await authService.changePassword(req.user.id, req.body);
    success(res, result, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Forgot password
 * @route POST /auth/forgot-password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const result = await authService.forgotPassword(req.body.email);
    success(res, result, 'Reset instructions sent');
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password
 * @route POST /auth/reset-password
 */
const resetPassword = async (req, res, next) => {
  try {
    const result = await authService.resetPassword(req.body);
    success(res, result, 'Password reset successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword
};
