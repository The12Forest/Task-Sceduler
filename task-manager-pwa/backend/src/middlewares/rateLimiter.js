const rateLimit = require('express-rate-limit');
const SystemConfig = require('../models/SystemConfig');

/** Cache for dynamic rate limit value */
let _apiMax = 100;
const refreshRateConfig = async () => {
  try {
    const cfg = await SystemConfig.getConfig();
    _apiMax = cfg.apiRateLimitPerMinute || 100;
  } catch { /* use default */ }
};
refreshRateConfig();
setInterval(refreshRateConfig, 60_000);

/**
 * Rate limiter for login endpoint
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for OTP endpoint
 */
const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5,
  message: {
    success: false,
    message: 'Too many OTP attempts. Please try again after 5 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * General API rate limiter (reads apiRateLimitPerMinute from SystemConfig)
 */
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window (per-minute rate)
  max: () => _apiMax,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Admin API rate limiter (stricter)
 */
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: {
    success: false,
    message: 'Too many admin requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { loginLimiter, otpLimiter, apiLimiter, adminLimiter };
