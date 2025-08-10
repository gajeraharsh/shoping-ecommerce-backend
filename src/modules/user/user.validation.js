/**
 * User Validation Schemas
 * Joi validation schemas for user endpoints
 */

const Joi = require('joi');

const updateProfileSchema = {
  body: Joi.object({
    name: Joi.string().min(2).max(50),
    email: Joi.string().email()
  }).min(1)
};

const getUsersSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string().allow(''),
    role: Joi.string().valid('USER', 'ADMIN'),
    sortBy: Joi.string().valid('createdAt', 'name', 'email').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
    includeDeleted: Joi.boolean().default(false)
  })
};

const getUserByIdSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required()
  }),
  query: Joi.object({
    includeDeleted: Joi.boolean().default(false)
  })
};

const updateUserSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required()
  }),
  body: Joi.object({
    name: Joi.string().min(2).max(50),
    email: Joi.string().email(),
    role: Joi.string().valid('USER', 'ADMIN')
  }).min(1)
};

const deleteUserSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required()
  })
};

module.exports = {
  updateProfileSchema,
  getUsersSchema,
  getUserByIdSchema,
  updateUserSchema,
  deleteUserSchema
};
