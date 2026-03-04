const SystemConfig = require('../models/SystemConfig');

/**
 * Maintenance-mode middleware.
 * When maintenanceMode is enabled in SystemConfig, all non-admin
 * requests receive a 503 Service Unavailable response.
 * Admin users and the public settings / health endpoints are exempt.
 */
const maintenanceGuard = async (req, res, next) => {
  try {
    // Always allow these paths so the frontend can still check status
    const exempt = ['/api/health', '/api/settings/public', '/api/auth/login', '/api/auth/refresh', '/api/system-status'];
    if (exempt.some((p) => req.path.startsWith(p))) return next();

    const cfg = await SystemConfig.getConfig();
    if (!cfg.maintenanceMode) return next();

    // Allow admins through (protect middleware sets req.user)
    if (req.user && req.user.role === 'admin') return next();

    return res.status(503).json({
      success: false,
      message: cfg.maintenanceMessage || 'System is under maintenance. Please try again later.',
    });
  } catch {
    // If config check fails, let request through
    next();
  }
};

module.exports = { maintenanceGuard };
