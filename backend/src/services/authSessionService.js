const User = require('../models/User');
const SystemConfig = require('../models/SystemConfig');
const {
  generateAccessToken,
  generateRefreshToken,
  getExpiry,
} = require('./tokenService');

/**
 * Set the refresh token cookie on the response.
 */
const setRefreshCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: getExpiry().refreshMs,
  });
};

/**
 * Format a user document for API responses.
 */
const formatUser = (user, overrides = {}) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  mustChangePassword: user.mustChangePassword || false,
  twoFactorEnabled: user.twoFactorEnabled || false,
  preferences: user.preferences,
  ...overrides,
});

/**
 * Issue tokens, store refresh token, reset login tracking, set cookie.
 * Shared between login (no-2FA) and verifyOtp flows.
 *
 * @param {Object} user - Mongoose User document (must have refreshTokens selected)
 * @param {Object} req  - Express request
 * @param {Object} res  - Express response
 * @param {Object} [formatOverrides] - Extra fields for formatUser
 * @returns {{ accessToken: string, formattedUser: Object }}
 */
const issueSessionTokens = async (user, req, res, formatOverrides = {}) => {
  const sysConfig = await SystemConfig.getConfig();
  const maxSessions = sysConfig.maxSessionsPerUser || 5;

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshTokens.push(refreshToken);
  if (user.refreshTokens.length > maxSessions) {
    user.refreshTokens = user.refreshTokens.slice(-maxSessions);
  }

  user.lastLoginAt = new Date();
  user.lastLoginIp = req.ip || req.socket?.remoteAddress || null;
  user.failedLoginAttempts = 0;
  user.lockedUntil = null;

  await user.save();

  setRefreshCookie(res, refreshToken);

  return {
    accessToken,
    formattedUser: formatUser(user, formatOverrides),
  };
};

module.exports = { setRefreshCookie, formatUser, issueSessionTokens };
