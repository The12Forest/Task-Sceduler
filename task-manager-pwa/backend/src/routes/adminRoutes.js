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
router.use(requireAdmin);
router.use(adminLimiter);

// Dashboard stats
router.get('/stats', getStats);

// User management
router.get('/users', getUsers);
router.get('/users/:id', getUser);
router.put('/users/:id/toggle-active', toggleUserActive);
router.put('/users/:id/role', changeUserRole);
router.post('/users/:id/force-password-reset', forcePasswordReset);
router.delete('/users/:id', deleteUser);

// System configuration
router.get('/config', getSystemConfig);
router.put('/config', updateSystemConfig);
router.post('/config/test-email', sendTestEmail);

// Impersonation
router.post('/impersonate/:userId', impersonateUser);
router.post('/stop-impersonation', stopImpersonation);

// Audit logs
router.get('/audit-logs', getAuditLogs);

// Data management
router.get('/export/:type', exportData);
router.delete('/cleanup/completed', cleanupCompletedTasks);

module.exports = router;
