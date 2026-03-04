const express = require('express');
const router = express.Router();

const { protect, requireAdmin } = require('../middlewares/auth');
const { adminLimiter } = require('../middlewares/rateLimiter');
const {
  getStats,
  getUsers,
  getUser,
  toggleUserActive,
  changeUserRole,
  forcePasswordReset,
  deleteUser,
  verifyUser,
  adminDisable2FA,
  getSystemConfig,
  updateSystemConfig,
  sendTestEmail,
  impersonateUser,
  stopImpersonation,
  getAuditLogs,
  exportData,
  cleanupCompletedTasks,
} = require('../controllers/adminController');

// All admin routes require authentication + admin role
router.use(protect);
router.use(adminLimiter);

// Stop impersonation must come BEFORE requireAdmin,
// because the impersonated user may not be an admin
router.post('/stop-impersonation', stopImpersonation);

// Everything else requires admin
router.use(requireAdmin);

// Dashboard stats
router.get('/stats', getStats);

// User management
router.get('/users', getUsers);
router.get('/users/:id', getUser);
router.put('/users/:id/toggle-active', toggleUserActive);
router.put('/users/:id/role', changeUserRole);
router.post('/users/:id/force-password-reset', forcePasswordReset);
router.post('/users/:id/verify', verifyUser);
router.post('/users/:id/disable-2fa', adminDisable2FA);
router.delete('/users/:id', deleteUser);

// System configuration
router.get('/config', getSystemConfig);
router.put('/config', updateSystemConfig);
router.post('/config/test-email', sendTestEmail);

// Impersonation (start — requires admin, registered above requireAdmin)
router.post('/impersonate/:userId', impersonateUser);
// stop-impersonation is registered above requireAdmin

// Audit logs
router.get('/audit-logs', getAuditLogs);

// Data management
router.get('/export/:type', exportData);
router.delete('/cleanup/completed', cleanupCompletedTasks);

module.exports = router;
