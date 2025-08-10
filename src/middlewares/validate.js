/**
 * Request Validation Middleware
 * Uses Joi schemas to validate request body, query, and params
 */

const Joi = require('joi');
const { HTTP_STATUS } = require('../utils/constants');
const { error } = require('../utils/response');

/**
 * Validation middleware factory
 * @param {Object} schema - Joi schema object with body, query, params
 * @returns {Function} Express middleware
 */
const validate = (schema) => {
  return (req, res, next) => {
    const validationErrors = [];

    // Validate request body
    if (schema.body) {
      const { error: bodyError } = schema.body.validate(req.body, { 
        abortEarly: false, 
        convert: true,
        stripUnknown: true 
      });
      if (bodyError) {
        validationErrors.push(...bodyError.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          type: 'body'
        })));
      }
    }

    // Validate query parameters
    if (schema.query) {
      const { error: queryError } = schema.query.validate(req.query, { 
        abortEarly: false, 
        convert: true,
        stripUnknown: true 
      });
      if (queryError) {
        validationErrors.push(...queryError.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          type: 'query'
        })));
      }
    }

    // Validate path parameters
    if (schema.params) {
      const { error: paramsError } = schema.params.validate(req.params, { 
        abortEarly: false, 
        convert: true 
      });
      if (paramsError) {
        validationErrors.push(...paramsError.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          type: 'params'
        })));
      }
    }

    if (validationErrors.length > 0) {
      return error(res, 'Validation failed', HTTP_STATUS.BAD_REQUEST, validationErrors);
    }

    next();
  };
};

module.exports = validate;
