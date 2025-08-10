/**
 * Order Validation Schemas
 * Joi validation schemas for order endpoints
 */

const Joi = require('joi');

const createOrderSchema = Joi.object({
  items: Joi.array().items(
    Joi.object({
      productId: Joi.number().integer().positive().required(),
      variantId: Joi.number().integer().positive().required(),
      quantity: Joi.number().integer().positive().required()
    })
  ).min(1).required(),
  addressId: Joi.number().integer().positive().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().required(),
  discountId: Joi.number().integer().positive().optional()
});

const getOrdersSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().valid(
    'createdAt:asc', 'createdAt:desc',
    'totalAmount:asc', 'totalAmount:desc',
    'status:asc', 'status:desc'
  ).default('createdAt:desc'),
  status: Joi.string().valid('PENDING', 'COMPLETED', 'CANCELLED').optional(),
  userId: Joi.number().integer().positive().optional()
});

const getOrderByIdSchema = Joi.object({
  id: Joi.number().integer().positive().required()
});

const updateOrderStatusSchema = Joi.object({
  status: Joi.string().valid('PENDING', 'COMPLETED', 'CANCELLED').required(),
  note: Joi.string().optional()
});

module.exports = {
  createOrderSchema,
  getOrdersSchema,
  getOrderByIdSchema,
  updateOrderStatusSchema
};
