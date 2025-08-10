/**
 * Rating Validation Schemas
 * Joi validation schemas for rating endpoints
 */

const Joi = require('joi');

const createRatingSchema = Joi.object({
  productId: Joi.number().integer().positive().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().optional().max(1000)
});

const updateRatingSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).optional(),
  comment: Joi.string().optional().max(1000)
});

const getProductRatingsSchema = Joi.object({
  productId: Joi.number().integer().positive().required()
});

const getRatingsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().valid(
    'createdAt:asc', 'createdAt:desc',
    'rating:asc', 'rating:desc'
  ).default('createdAt:desc'),
  rating: Joi.number().integer().min(1).max(5).optional()
});

const getRatingByIdSchema = Joi.object({
  id: Joi.number().integer().positive().required()
});

module.exports = {
  createRatingSchema,
  updateRatingSchema,
  getProductRatingsSchema,
  getRatingsQuerySchema,
  getRatingByIdSchema
};
