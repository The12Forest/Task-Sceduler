const express = require('express');
const router = express.Router();
const SystemConfig = require('../models/SystemConfig');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/settings/public
 * Get public system config (non-sensitive fields for frontend).
 * Does NOT require authentication so maintenance info and registration
 * settings can be displayed on login/register pages.
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
        requireEmailVerification: cfg.requireEmailVerification,
        defaultPriority: cfg.defaultPriority,
        allowFileUploads: cfg.allowFileUploads,
        maxTasksPerUser: cfg.maxTasksPerUser,
        maxListsPerUser: cfg.maxListsPerUser,
        enableBrowserNotifications: cfg.enableBrowserNotifications,
        maintenanceMode: cfg.maintenanceMode,
        maintenanceMessage: cfg.maintenanceMessage,
        // Password policy (for frontend validation hints)
        passwordMinLength: cfg.passwordMinLength,
        passwordRequireUppercase: cfg.passwordRequireUppercase,
        passwordRequireNumbers: cfg.passwordRequireNumbers,
        passwordRequireSpecial: cfg.passwordRequireSpecial,
      },
    });
  })
);

module.exports = router;
