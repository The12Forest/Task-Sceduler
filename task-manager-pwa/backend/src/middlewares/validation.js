const Joi = require('joi');
const { AppError } = require('./errorHandler');

/**
 * Generic validation middleware factory
 * @param {Joi.ObjectSchema} schema - Joi validation schema
 */
const validate = (schema) => (req, _res, next) => {
  const { error } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const message = error.details.map((d) => d.message).join(', ');
    return next(new AppError(message, 400));
  }

  next();
};

// ──── Auth Schemas ────

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().min(8).max(128).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().required(),
});

const otpSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  otp: Joi.string().length(6).pattern(/^\d+$/).required(),
});

// ──── Task Schemas ────

const createTaskSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).required(),
  description: Joi.string().trim().max(2000).allow('').optional(),
  priority: Joi.string().valid('Low', 'Medium', 'High').optional(),
  dueDate: Joi.date().iso().allow(null).optional(),
  listId: Joi.string().hex().length(24).required(),
});

const updateTaskSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).optional(),
  description: Joi.string().trim().max(2000).allow('').optional(),
  priority: Joi.string().valid('Low', 'Medium', 'High').optional(),
  dueDate: Joi.date().iso().allow(null).optional(),
  completed: Joi.boolean().optional(),
  listId: Joi.string().hex().length(24).optional(),
});

// ──── List Schemas ────

const createListSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
});

const updateListSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
});

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  otpSchema,
  createTaskSchema,
  updateTaskSchema,
  createListSchema,
  updateListSchema,
};
