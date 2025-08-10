/**
 * Wishlist Validation Schemas
 * Joi validation schemas for wishlist endpoints
 */

const Joi = require('joi');

const getWishlistSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().valid(
    'createdAt:asc', 'createdAt:desc'
  ).default('createdAt:desc')
});

const addToWishlistSchema = Joi.object({
  productId: Joi.number().integer().positive().required()
});

const removeFromWishlistSchema = Joi.object({
  productId: Joi.number().integer().positive().required()
});

module.exports = {
  getWishlistSchema,
  addToWishlistSchema,
  removeFromWishlistSchema
};
