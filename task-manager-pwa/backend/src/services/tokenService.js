const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Generate short-lived access token (15 minutes)
 */
const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, config.jwtAccessSecret, { expiresIn: '15m' });
};

/**
 * Generate refresh token (7 days)
 */
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, config.jwtRefreshSecret, { expiresIn: '7d' });
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
};
