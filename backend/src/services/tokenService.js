const jwt = require('jsonwebtoken');
const config = require('../config');
const SystemConfig = require('../models/SystemConfig');

/** Cache config for token generation so we don't hit DB on every call */
let _cachedExpiry = { access: '15m', refresh: '7d', refreshMs: 7 * 24 * 60 * 60 * 1000 };

const loadExpiry = async () => {
  try {
    const cfg = await SystemConfig.getConfig();
    _cachedExpiry = {
      access: `${cfg.accessTokenExpiryMinutes || 15}m`,
      refresh: `${cfg.refreshTokenExpiryDays || 7}d`,
      refreshMs: (cfg.refreshTokenExpiryDays || 7) * 24 * 60 * 60 * 1000,
    };
  } catch { /* use defaults */ }
  return _cachedExpiry;
};

// Refresh cache every 60 s
setInterval(loadExpiry, 60_000);
loadExpiry();

const getExpiry = () => _cachedExpiry;

/**
 * Generate short-lived access token (configurable, default 15 minutes)
 */
const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, config.jwtAccessSecret, { expiresIn: _cachedExpiry.access });
};

/**
 * Generate refresh token (configurable, default 7 days)
 */
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, config.jwtRefreshSecret, { expiresIn: _cachedExpiry.refresh });
};

/**
 * Generate email verification token (15 minutes)
 */
const generateVerificationToken = (userId) => {
  return jwt.sign({ userId, purpose: 'email-verification' }, config.jwtAccessSecret, {
    expiresIn: '15m',
  });
};

/**
 * Verify access token
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, config.jwtAccessSecret);
};

/**
 * Verify refresh token
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.jwtRefreshSecret);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateVerificationToken,
  verifyAccessToken,
  verifyRefreshToken,
  getExpiry,
  loadExpiry,
};
