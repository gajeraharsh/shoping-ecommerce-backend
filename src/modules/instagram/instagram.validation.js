/**
 * Instagram Validation Schemas
 * Joi validation schemas for Instagram reel endpoints
 */

const Joi = require('joi');

const createReelSchema = Joi.object({
  title: Joi.string().required().max(255),
  description: Joi.string().optional().max(1000),
  instagramUrl: Joi.string().uri().optional(),
  tags: Joi.string().optional(), // JSON string array
  isActive: Joi.boolean().default(true)
});

const updateReelSchema = Joi.object({
  title: Joi.string().optional().max(255),
  description: Joi.string().optional().max(1000),
  instagramUrl: Joi.string().uri().optional(),
  tags: Joi.string().optional(), // JSON string array
  isActive: Joi.boolean().optional()
});

const getReelsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().valid(
    'createdAt:asc', 'createdAt:desc',
    'title:asc', 'title:desc'
  ).default('createdAt:desc'),
  isActive: Joi.string().valid('true', 'false').optional(),
  search: Joi.string().optional().max(255)
});

const getReelByIdSchema = Joi.object({
  id: Joi.number().integer().positive().required()
});

module.exports = {
  createReelSchema,
  updateReelSchema,
  getReelsSchema,
  getReelByIdSchema
};
