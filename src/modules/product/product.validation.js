/**
 * Product Validation Schemas
 * Joi validation schemas for product endpoints
 */

const Joi = require('joi');

const createProductSchema = Joi.object({
  name: Joi.string().required().min(1).max(255),
  sku: Joi.string().optional().max(100),
  slug: Joi.string().optional().max(255),
  description: Joi.string().optional(),
  price: Joi.number().positive().required(),
  discountedPrice: Joi.number().positive().optional(),
  stock: Joi.number().integer().min(0).default(0),
  categoryId: Joi.number().integer().positive().required(),
  tags: Joi.string().optional(),
  descriptionHtml: Joi.string().optional(),
  keyfeatures: Joi.string().optional(),
  productDetails: Joi.string().optional(),
  fitguide: Joi.string().optional(),
  styleguide: Joi.string().optional()
});

const updateProductSchema = Joi.object({
  name: Joi.string().optional().min(1).max(255),
  sku: Joi.string().optional().max(100),
  slug: Joi.string().optional().max(255),
  description: Joi.string().optional(),
  price: Joi.number().positive().optional(),
  discountedPrice: Joi.number().positive().optional(),
  stock: Joi.number().integer().min(0).optional(),
  categoryId: Joi.number().integer().positive().optional(),
  tags: Joi.string().optional(),
  descriptionHtml: Joi.string().optional(),
  keyfeatures: Joi.string().optional(),
  productDetails: Joi.string().optional(),
  fitguide: Joi.string().optional(),
  styleguide: Joi.string().optional()
});

const getProductsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().valid(
    'createdAt:asc', 'createdAt:desc',
    'price:asc', 'price:desc',
    'name:asc', 'name:desc',
    'stock:asc', 'stock:desc'
  ).default('createdAt:desc'),
  search: Joi.string().optional(),
  categoryId: Joi.number().integer().positive().optional(),
  minPrice: Joi.number().positive().optional(),
  maxPrice: Joi.number().positive().optional(),
  inStock: Joi.string().valid('true', 'false').optional()
});

const getProductByIdSchema = Joi.object({
  id: Joi.number().integer().positive().required()
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  getProductsSchema,
  getProductByIdSchema
};
