const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
const { AppError } = require('./errorHandler');

/**
 * Protect routes - verify access token from Authorization header
 */
const protect = async (req, _res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Not authorized, no token provided', 401));
    }

    const decoded = jwt.verify(token, config.jwtAccessSecret);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return next(new AppError('User no longer exists', 401));
    }

    if (!user.isActive) {
      return next(new AppError('Account has been deactivated', 403));
    }

    if (!user.isVerified) {
      return next(new AppError('Account not verified', 403));
    }

    // Support impersonation: if token has impersonatedBy, track it
    req.user = {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    if (decoded.impersonatedBy) {
      req.user.impersonatedBy = decoded.impersonatedBy;
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Require admin role
 */
const requireAdmin = (req, _res, next) => {
  if (req.user.role !== 'admin') {
    return next(new AppError('Admin access required', 403));
  }
  next();
};

/**
 * Require admin or moderator role
 */
const requireModeratorOrAdmin = (req, _res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
    return next(new AppError('Insufficient permissions', 403));
  }
  next();
};

module.exports = { protect, requireAdmin, requireModeratorOrAdmin };
