/**
 * Authentication Validation Schemas
 * Joi validation schemas for auth endpoints
 */

const Joi = require('joi');

const registerSchema = {
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    name: Joi.string().min(2).max(50).required(),
    role: Joi.string().valid('USER', 'ADMIN').default('USER')
  })
};

const loginSchema = {
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  })
};

const refreshTokenSchema = {
  body: Joi.object({
    refreshToken: Joi.string().required()
  })
};

const forgotPasswordSchema = {
  body: Joi.object({
    email: Joi.string().email().required()
  })
};

const resetPasswordSchema = {
  body: Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(6).required()
  })
};

const changePasswordSchema = {
  body: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required()
  })
};

module.exports = {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema
};
