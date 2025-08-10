/**
 * Address Validation Schemas
 * Joi validation schemas for address endpoints
 */

const Joi = require('joi');

const createAddressSchema = Joi.object({
  name: Joi.string().required().max(255),
  phone: Joi.string().required().max(20),
  address: Joi.string().required().max(500),
  city: Joi.string().required().max(100),
  state: Joi.string().required().max(100),
  country: Joi.string().required().max(100),
  zipCode: Joi.string().required().max(20),
  isDefault: Joi.boolean().default(false)
});

const updateAddressSchema = Joi.object({
  name: Joi.string().optional().max(255),
  phone: Joi.string().optional().max(20),
  address: Joi.string().optional().max(500),
  city: Joi.string().optional().max(100),
  state: Joi.string().optional().max(100),
  country: Joi.string().optional().max(100),
  zipCode: Joi.string().optional().max(20),
  isDefault: Joi.boolean().optional()
});

const getAddressByIdSchema = Joi.object({
  id: Joi.number().integer().positive().required()
});

module.exports = {
  createAddressSchema,
  updateAddressSchema,
  getAddressByIdSchema
};
