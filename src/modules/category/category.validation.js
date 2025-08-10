/**
 * Category Validation Schemas
 * Joi validation schemas for category endpoints
 */

const Joi = require('joi');

const createCategorySchema = {
  body: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    slug: Joi.string().min(2).max(100).pattern(/^[a-z0-9-]+$/).required()
  })
};

const updateCategorySchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required()
  }),
  body: Joi.object({
    name: Joi.string().min(2).max(100),
    slug: Joi.string().min(2).max(100).pattern(/^[a-z0-9-]+$/)
  }).min(1)
};

const getCategoriesSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string().allow(''),
    sortBy: Joi.string().valid('createdAt', 'name', 'slug').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
    includeDeleted: Joi.boolean().default(false)
  })
};

const getCategoryByIdSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required()
  })
};

const deleteCategorySchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required()
  })
};

module.exports = {
  createCategorySchema,
  updateCategorySchema,
  getCategoriesSchema,
  getCategoryByIdSchema,
  deleteCategorySchema
};
