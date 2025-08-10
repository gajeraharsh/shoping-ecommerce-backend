/**
 * Centralized Error Handling Middleware
 * Catches all errors and returns standardized JSON responses
 */

const { logger } = require('../utils/logger');
const { HTTP_STATUS, MESSAGES } = require('../utils/constants');

/**
 * Global error handler middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error with request context
  logger.error('Error occurred:', {
    error: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });

  let message = MESSAGES.INTERNAL_ERROR;
  let status = HTTP_STATUS.INTERNAL_SERVER_ERROR;

  // Prisma errors
  if (error.code) {
    switch (error.code) {
      case 'P2002':
        message = 'Duplicate entry. Resource already exists.';
        status = HTTP_STATUS.CONFLICT;
        break;
      case 'P2025':
        message = 'Resource not found.';
        status = HTTP_STATUS.NOT_FOUND;
        break;
      case 'P2003':
        message = 'Foreign key constraint failed.';
        status = HTTP_STATUS.BAD_REQUEST;
        break;
      default:
        message = 'Database error occurred.';
        status = HTTP_STATUS.INTERNAL_SERVER_ERROR;
    }
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    message = MESSAGES.UNAUTHORIZED;
    status = HTTP_STATUS.UNAUTHORIZED;
  }

  if (error.name === 'TokenExpiredError') {
    message = MESSAGES.TOKEN_EXPIRED;
    status = HTTP_STATUS.UNAUTHORIZED;
  }

  // Validation errors
  if (error.name === 'ValidationError') {
    message = MESSAGES.VALIDATION_ERROR;
    status = HTTP_STATUS.BAD_REQUEST;
  }

  // Multer errors
  if (error.code === 'LIMIT_FILE_SIZE') {
    message = 'File size too large. Maximum size is 5MB.';
    status = HTTP_STATUS.BAD_REQUEST;
  }

  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    message = 'Too many files uploaded.';
    status = HTTP_STATUS.BAD_REQUEST;
  }

  // Custom application errors
  if (error.isOperational) {
    message = error.message;
    status = error.statusCode || HTTP_STATUS.BAD_REQUEST;
  }

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};

/**
 * Handle 404 errors for unmatched routes
 */
const notFound = (req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = HTTP_STATUS.NOT_FOUND;
  next(error);
};

/**
 * Custom error class for operational errors
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  errorHandler,
  notFound,
  AppError
};
