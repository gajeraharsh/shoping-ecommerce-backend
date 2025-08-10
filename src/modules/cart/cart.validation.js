/**
 * Cart Validation Schemas
 * Joi validation schemas for cart endpoints
 */

const Joi = require('joi');

const addToCartSchema = Joi.object({
  productId: Joi.number().integer().positive().required(),
  variantId: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().positive().required()
});

const updateCartItemSchema = Joi.object({
  quantity: Joi.number().integer().positive().required()
});

const cartItemIdSchema = Joi.object({
  itemId: Joi.number().integer().positive().required()
});

module.exports = {
  addToCartSchema,
  updateCartItemSchema,
  cartItemIdSchema
};
