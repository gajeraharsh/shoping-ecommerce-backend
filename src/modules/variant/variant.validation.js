/**
 * Product Variant Validation Schemas
 * Joi validation schemas for product variant endpoints
 */

const Joi = require('joi');

const createVariantSchema = Joi.object({
  productId: Joi.number().integer().positive().required(),
  sku: Joi.string().optional().max(100),
  size: Joi.string().optional().max(50),
  color: Joi.string().optional().max(50),
  price: Joi.number().positive().required(),
  discountedPrice: Joi.number().positive().optional(),
  stock: Joi.number().integer().min(0).default(0)
});

const updateVariantSchema = Joi.object({
  productId: Joi.number().integer().positive().optional(),
  sku: Joi.string().optional().max(100),
  size: Joi.string().optional().max(50),
  color: Joi.string().optional().max(50),
  price: Joi.number().positive().optional(),
  discountedPrice: Joi.number().positive().optional(),
  stock: Joi.number().integer().min(0).optional()
});

const getVariantsByProductSchema = Joi.object({
  productId: Joi.number().integer().positive().required()
});

const getVariantByIdSchema = Joi.object({
  id: Joi.number().integer().positive().required()
});

module.exports = {
  createVariantSchema,
  updateVariantSchema,
  getVariantsByProductSchema,
  getVariantByIdSchema
};
