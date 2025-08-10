/**
 * Standard API Response Helper
 * Provides consistent response format for success and error responses
 */

const { HTTP_STATUS, MESSAGES } = require('./constants');

/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} status - HTTP status code
 */
const success = (res, data = null, message = MESSAGES.SUCCESS, status = HTTP_STATUS.OK) => {
  return res.status(status).json({
    success: true,
    message,
    data
  });
};

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} status - HTTP status code
 * @param {Array} errors - Detailed error array
 */
const error = (res, message = MESSAGES.INTERNAL_ERROR, status = HTTP_STATUS.INTERNAL_SERVER_ERROR, errors = null) => {
  const response = {
    success: false,
    message
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(status).json(response);
};

/**
 * Send paginated response
 * @param {Object} res - Express response object
 * @param {Array} data - Response data array
 * @param {Object} meta - Pagination metadata
 * @param {string} message - Success message
 */
const paginated = (res, data, meta, message = MESSAGES.SUCCESS) => {
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message,
    data,
    meta
  });
};

module.exports = {
  success,
  error,
  paginated
};
