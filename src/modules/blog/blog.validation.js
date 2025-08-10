/**
 * Blog Validation Schemas
 * Joi validation schemas for blog endpoints
 */

const Joi = require('joi');

const createBlogPostSchema = Joi.object({
  title: Joi.string().required().max(255),
  slug: Joi.string().optional().max(255),
  excerpt: Joi.string().optional().max(500),
  content: Joi.string().required(),
  categoryId: Joi.number().integer().positive().required(),
  tags: Joi.string().optional(),
  published: Joi.boolean().default(false)
});

const updateBlogPostSchema = Joi.object({
  title: Joi.string().optional().max(255),
  slug: Joi.string().optional().max(255),
  excerpt: Joi.string().optional().max(500),
  content: Joi.string().optional(),
  categoryId: Joi.number().integer().positive().optional(),
  tags: Joi.string().optional(),
  published: Joi.boolean().optional()
});

const getBlogPostsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().valid(
    'createdAt:asc', 'createdAt:desc',
    'title:asc', 'title:desc',
    'publishedAt:asc', 'publishedAt:desc'
  ).default('createdAt:desc'),
  search: Joi.string().optional(),
  categoryId: Joi.number().integer().positive().optional(),
  published: Joi.string().valid('true', 'false').optional(),
  authorId: Joi.number().integer().positive().optional()
});

const getBlogPostByIdSchema = Joi.object({
  id: Joi.alternatives().try(
    Joi.number().integer().positive(),
    Joi.string()
  ).required()
});

const addCommentSchema = Joi.object({
  content: Joi.string().required().min(1).max(1000)
});

const getCommentsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().valid(
    'createdAt:asc', 'createdAt:desc'
  ).default('createdAt:desc')
});

module.exports = {
  createBlogPostSchema,
  updateBlogPostSchema,
  getBlogPostsSchema,
  getBlogPostByIdSchema,
  addCommentSchema,
  getCommentsSchema
};
