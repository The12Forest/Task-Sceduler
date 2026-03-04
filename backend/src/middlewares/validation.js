const Joi = require('joi');
const { AppError } = require('./errorHandler');
const SystemConfig = require('../models/SystemConfig');

/**
 * Parse JSON-encoded multipart form fields (e.g. tags, subtasks)
 */
const parseJsonFields = (body, fields) => {
  for (const field of fields) {
    if (typeof body[field] === 'string') {
      try {
        body[field] = JSON.parse(body[field]);
      } catch {
        /* leave as-is, Joi will catch invalid format */
      }
    }
  }
  // selfDestruct comes as string "true"/"false" from FormData
  if (typeof body.selfDestruct === 'string') {
    body.selfDestruct = body.selfDestruct === 'true';
  }
};

/**
 * Generic validation middleware factory
 * @param {Joi.ObjectSchema} schema - Joi validation schema
 */
const validate = (schema) => (req, _res, next) => {
  // Pre-parse JSON-encoded FormData fields
  parseJsonFields(req.body, ['tags', 'subtasks']);

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

/**
 * Dynamic password validation middleware.
 * Reads password policy from SystemConfig at request time.
 * Validates req.body.password (for register) or req.body.newPassword (for password change).
 */
const validatePassword = async (req, _res, next) => {
  try {
    const password = req.body.password || req.body.newPassword;
    if (!password) return next(); // let Joi base schema catch missing password

    const cfg = await SystemConfig.getConfig();
    const minLen = cfg.passwordMinLength || 8;

    if (password.length < minLen) {
      return next(new AppError(`Password must be at least ${minLen} characters`, 400));
    }
    if (cfg.passwordRequireUppercase && !/[A-Z]/.test(password)) {
      return next(new AppError('Password must contain at least one uppercase letter', 400));
    }
    if (cfg.passwordRequireNumbers && !/\d/.test(password)) {
      return next(new AppError('Password must contain at least one number', 400));
    }
    if (cfg.passwordRequireSpecial && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return next(new AppError('Password must contain at least one special character', 400));
    }

    next();
  } catch (err) {
    next(err);
  }
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

const subtaskJoi = Joi.object({
  name: Joi.string().trim().min(1).max(200).required(),
  completed: Joi.boolean().optional(),
});

const createTaskSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).required(),
  description: Joi.string().trim().max(2000).allow('').optional(),
  priority: Joi.string().valid('Low', 'Medium', 'High').optional(),
  dueDate: Joi.date().iso().allow(null).optional(),
  listId: Joi.string().hex().length(24).required(),
  tags: Joi.array().items(Joi.string().trim().max(50)).max(20).optional(),
  subtasks: Joi.array().items(subtaskJoi).max(50).optional(),
  selfDestruct: Joi.boolean().optional(),
});

const updateTaskSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).optional(),
  description: Joi.string().trim().max(2000).allow('').optional(),
  priority: Joi.string().valid('Low', 'Medium', 'High').optional(),
  dueDate: Joi.date().iso().allow(null).optional(),
  completed: Joi.boolean().optional(),
  listId: Joi.string().hex().length(24).optional(),
  tags: Joi.array().items(Joi.string().trim().max(50)).max(20).optional(),
  subtasks: Joi.array().items(subtaskJoi).max(50).optional(),
  selfDestruct: Joi.boolean().optional(),
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
  validatePassword,
  registerSchema,
  loginSchema,
  otpSchema,
  createTaskSchema,
  updateTaskSchema,
  createListSchema,
  updateListSchema,
};
