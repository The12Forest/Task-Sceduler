const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const SystemConfig = require('../models/SystemConfig');
const asyncHandler = require('../utils/asyncHandler');

// All settings routes require authentication
router.use(protect);

/**
 * GET /api/settings/public
 * Get public system config (non-sensitive fields for frontend)
 */
router.get(
  '/public',
  asyncHandler(async (_req, res) => {
    const cfg = await SystemConfig.getConfig();
    res.json({
      success: true,
      config: {
        appName: cfg.appName,
        appLogoUrl: cfg.appLogoUrl,
        appFaviconUrl: cfg.appFaviconUrl,
        defaultLanguage: cfg.defaultLanguage,
        defaultTimezone: cfg.defaultTimezone,
        supportEmail: cfg.supportEmail,
        footerText: cfg.footerText,
        allowPublicRegistration: cfg.allowPublicRegistration,
        defaultPriority: cfg.defaultPriority,
        allowFileUploads: cfg.allowFileUploads,
        maxTasksPerUser: cfg.maxTasksPerUser,
        maxListsPerUser: cfg.maxListsPerUser,
        enableBrowserNotifications: cfg.enableBrowserNotifications,
        maintenanceMode: cfg.maintenanceMode,
        maintenanceMessage: cfg.maintenanceMessage,
      },
    });
  })
);

module.exports = router;
