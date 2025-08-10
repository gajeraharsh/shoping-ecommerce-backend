/**
 * Feed Validation Schemas
 * Joi validation schemas for feed section endpoints
 */

const Joi = require('joi');

const createFeedSectionSchema = Joi.object({
  title: Joi.string().required().max(255),
  description: Joi.string().optional().max(500),
  linkUrl: Joi.string().uri().optional(),
  order: Joi.number().integer().min(0).default(0),
  isActive: Joi.boolean().default(true)
});

const updateFeedSectionSchema = Joi.object({
  title: Joi.string().optional().max(255),
  description: Joi.string().optional().max(500),
  linkUrl: Joi.string().uri().optional(),
  order: Joi.number().integer().min(0).optional(),
  isActive: Joi.boolean().optional()
});

const getFeedSectionsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().valid(
    'order:asc', 'order:desc',
    'createdAt:asc', 'createdAt:desc',
    'title:asc', 'title:desc'
  ).default('order:asc'),
  isActive: Joi.string().valid('true', 'false').optional()
});

const getFeedSectionByIdSchema = Joi.object({
  id: Joi.number().integer().positive().required()
});

module.exports = {
  createFeedSectionSchema,
  updateFeedSectionSchema,
  getFeedSectionsSchema,
  getFeedSectionByIdSchema
};
