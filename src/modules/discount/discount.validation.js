/**
 * Discount Validation Schemas
 * Joi validation schemas for discount endpoints
 */

const Joi = require('joi');

const createDiscountSchema = Joi.object({
  code: Joi.string().uppercase().required().min(3).max(50),
  description: Joi.string().required().max(255),
  type: Joi.string().valid('PERCENTAGE', 'FIXED').required(),
  value: Joi.number().positive().required(),
  minOrderAmount: Joi.number().positive().optional(),
  maxDiscountAmount: Joi.number().positive().optional(),
  usageLimit: Joi.number().integer().positive().optional(),
  isActive: Joi.boolean().default(true),
  validFrom: Joi.date().optional(),
  validTo: Joi.date().optional()
});

const updateDiscountSchema = Joi.object({
  code: Joi.string().uppercase().optional().min(3).max(50),
  description: Joi.string().optional().max(255),
  type: Joi.string().valid('PERCENTAGE', 'FIXED').optional(),
  value: Joi.number().positive().optional(),
  minOrderAmount: Joi.number().positive().optional(),
  maxDiscountAmount: Joi.number().positive().optional(),
  usageLimit: Joi.number().integer().positive().optional(),
  isActive: Joi.boolean().optional(),
  validFrom: Joi.date().optional(),
  validTo: Joi.date().optional()
});

const getDiscountsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().valid(
    'createdAt:asc', 'createdAt:desc',
    'code:asc', 'code:desc',
    'value:asc', 'value:desc'
  ).default('createdAt:desc'),
  isActive: Joi.string().valid('true', 'false').optional(),
  type: Joi.string().valid('PERCENTAGE', 'FIXED').optional()
});

const getDiscountByIdSchema = Joi.object({
  id: Joi.number().integer().positive().required()
});

const validateDiscountCodeSchema = Joi.object({
  code: Joi.string().required()
});

module.exports = {
  createDiscountSchema,
  updateDiscountSchema,
  getDiscountsSchema,
  getDiscountByIdSchema,
  validateDiscountCodeSchema
};
