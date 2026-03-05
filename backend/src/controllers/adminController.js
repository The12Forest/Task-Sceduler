const User = require('../models/User');
const Task = require('../models/Task');
const TodoList = require('../models/TodoList');
const SystemConfig = require('../models/SystemConfig');
const AuditLog = require('../models/AuditLog');
const { AppError } = require('../middlewares/errorHandler');
const asyncHandler = require('../utils/asyncHandler');
const {
  generateAccessToken,
} = require('../services/tokenService');
const jwt = require('jsonwebtoken');
const config = require('../config');
const nodemailer = require('nodemailer');

// ── Helper: create audit log ──
const audit = async (adminId, action, category, opts = {}) => {
  try {
    await AuditLog.create({
      adminId,
      action,
      category,
      affectedUserId: opts.affectedUserId || null,
      oldValue: opts.oldValue || null,
      newValue: opts.newValue || null,
      ipAddress: opts.ip || null,
      details: opts.details || '',
    });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
};

// ═══════════════════════════════════════════
// ════ DASHBOARD / STATS ════
// ═══════════════════════════════════════════

/**
 * GET /api/admin/stats
 */
const getStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thirtyDaysAgo = new Date(todayStart - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    activeUsers,
    totalTasks,
    completedTasks,
    overdueTasks,
    tasksCreatedToday,
    tasksCompletedToday,
    totalLists,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    Task.countDocuments(),
    Task.countDocuments({ completed: true }),
    Task.countDocuments({ completed: false, dueDate: { $lt: now, $ne: null } }),
    Task.countDocuments({ createdAt: { $gte: todayStart } }),
    Task.countDocuments({ completed: true, updatedAt: { $gte: todayStart } }),
    TodoList.countDocuments(),
  ]);

  // Tasks created per day (last 30 days)
  const tasksPerDay = await Task.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // User registrations per week (last 12 weeks)
  const twelveWeeksAgo = new Date(todayStart - 84 * 24 * 60 * 60 * 1000);
  const registrationsPerWeek = await User.aggregate([
    { $match: { createdAt: { $gte: twelveWeeksAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-W%V', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json({
    success: true,
    stats: {
      totalUsers,
      activeUsers,
      totalTasks,
      completedTasks,
      overdueTasks,
      tasksCreatedToday,
      tasksCompletedToday,
      totalLists,
    },
    charts: {
      tasksPerDay,
      registrationsPerWeek,
    },
  });
});

// ═══════════════════════════════════════════
// ════ USER MANAGEMENT ════
// ═══════════════════════════════════════════

/**
 * GET /api/admin/users
 */
const getUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 25;
  const skip = (page - 1) * limit;
  const search = req.query.search || '';

  const filter = {};
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('name email role isVerified isActive lastLoginAt createdAt twoFactorEnabled')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  // Get task counts per user
  const userIds = users.map((u) => u._id);
  const taskCounts = await Task.aggregate([
    { $match: { userId: { $in: userIds } } },
    {
      $group: {
        _id: '$userId',
        total: { $sum: 1 },
        completed: { $sum: { $cond: ['$completed', 1, 0] } },
      },
    },
  ]);

  const countMap = {};
  taskCounts.forEach((c) => {
    countMap[c._id.toString()] = { totalTasks: c.total, completedTasks: c.completed };
  });

  const usersWithStats = users.map((u) => ({
    ...u,
    ...(countMap[u._id.toString()] || { totalTasks: 0, completedTasks: 0 }),
  }));

  res.json({
    success: true,
    users: usersWithStats,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

/**
 * GET /api/admin/users/:id
 */
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('name email role isVerified isActive lastLoginAt lastLoginIp createdAt updatedAt mustChangePassword preferences')
    .lean();
  if (!user) throw new AppError('User not found', 404);

  const [taskCount, listCount] = await Promise.all([
    Task.countDocuments({ userId: user._id }),
    TodoList.countDocuments({ userId: user._id }),
  ]);

  res.json({ success: true, user: { ...user, taskCount, listCount } });
});

/**
 * PUT /api/admin/users/:id/toggle-active
 */
const toggleUserActive = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);
  if (user._id.toString() === req.user.id.toString()) {
    throw new AppError('Cannot deactivate your own account', 400);
  }

  const wasActive = user.isActive;
  user.isActive = !user.isActive;
  await user.save();

  await audit(req.user.id, `${user.isActive ? 'activate' : 'deactivate'}_user`, 'user', {
    affectedUserId: user._id,
    oldValue: { isActive: wasActive },
    newValue: { isActive: user.isActive },
    ip: req.ip,
  });

  res.json({ success: true, user: { id: user._id, isActive: user.isActive } });
});

/**
 * PUT /api/admin/users/:id/role
 */
const changeUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['user', 'admin', 'moderator'].includes(role)) {
    throw new AppError('Invalid role', 400);
  }

  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);

  const oldRole = user.role;
  user.role = role;
  await user.save();

  await audit(req.user.id, 'change_user_role', 'user', {
    affectedUserId: user._id,
    oldValue: { role: oldRole },
    newValue: { role },
    ip: req.ip,
  });

  res.json({ success: true, user: { id: user._id, role: user.role } });
});

/**
 * POST /api/admin/users/:id/force-password-reset
 */
const forcePasswordReset = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);

  user.mustChangePassword = true;
  await user.save();

  await audit(req.user.id, 'force_password_reset', 'user', {
    affectedUserId: user._id,
    ip: req.ip,
  });

  res.json({ success: true, message: 'User will be required to change password on next login' });
});

/**
 * DELETE /api/admin/users/:id
 */
const deleteUser = asyncHandler(async (req, res) => {
  if (req.user.impersonatedBy) {
    throw new AppError('Cannot delete users while impersonating', 403);
  }

  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);
  if (user._id.toString() === req.user.id.toString()) {
    throw new AppError('Cannot delete your own account', 400);
  }

  // Full cascade hard-delete — purge all user data so email is immediately reusable
  await Task.deleteMany({ userId: user._id });
  await TodoList.deleteMany({ userId: user._id });
  await AuditLog.updateMany(
    { affectedUserId: user._id },
    { $set: { affectedUserId: null, details: `[deleted] ${user.email}` } }
  );
  await User.deleteOne({ _id: user._id });

  await audit(req.user.id, 'delete_user', 'user', {
    affectedUserId: user._id,
    details: `Deleted user ${user.email}`,
    ip: req.ip,
  });

  res.json({ success: true, message: 'User and all associated data deleted' });
});

/**
 * POST /api/admin/users/:id/verify
 * Admin manually verifies a user's email
 */
const verifyUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);

  if (user.isVerified) {
    return res.json({ success: true, message: 'User is already verified' });
  }

  user.isVerified = true;
  await user.save();

  await audit(req.user.id, 'verify_user', 'user', {
    affectedUserId: user._id,
    details: `Manually verified ${user.email}`,
    ip: req.ip,
  });

  res.json({ success: true, message: `User ${user.email} has been verified` });
});

/**
 * POST /api/admin/users/:id/disable-2fa
 * Admin forcibly disables a user's 2FA
 */
const adminDisable2FA = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);

  if (!user.twoFactorEnabled) {
    return res.json({ success: true, message: '2FA is already disabled for this user' });
  }

  user.twoFactorEnabled = false;
  user.totpSecret = null;
  await user.save();

  await audit(req.user.id, 'admin_disable_2fa', 'user', {
    affectedUserId: user._id,
    details: `Admin disabled 2FA for ${user.email}`,
    ip: req.ip,
  });

  res.json({ success: true, message: `2FA disabled for ${user.email}` });
});

// ═══════════════════════════════════════════
// ════ SYSTEM CONFIGURATION ════
// ═══════════════════════════════════════════

/**
 * GET /api/admin/config
 */
const getSystemConfig = asyncHandler(async (req, res) => {
  const cfg = await SystemConfig.getConfig();

  // Expose read-only .env values so the admin panel shows them
  const envOverrides = {
    adminEmail: config.adminEmail || null,
    clientUrl: config.clientUrl || null,
    smtpHostEnv: config.smtp.host || null,
    smtpPortEnv: config.smtp.port || null,
    smtpUserEnv: config.smtp.user || null,
    smtpFromEnv: config.smtp.from || null,
    nodeEnv: process.env.NODE_ENV || 'development',
  };

  res.json({ success: true, config: cfg, envOverrides });
});

/**
 * PUT /api/admin/config
 */
const updateSystemConfig = asyncHandler(async (req, res) => {
  const cfg = await SystemConfig.getConfigWithSecrets();

  // Track changes for audit
  const changes = {};
  const restartRequired = [];

  const editable = [
    'appName', 'appLogoUrl', 'appFaviconUrl', 'defaultLanguage', 'defaultTimezone',
    'supportEmail', 'footerText',
    'serverPort', 'baseUrl', 'forceHttps', 'enableCors', 'allowedOrigins',
    'enableRequestLogging', 'logLevel', 'apiRateLimitPerMinute', 'maxUploadSizeMB',
    'smtpHost', 'smtpPort', 'smtpUser', 'smtpPass', 'smtpEncryption', 'smtpFromName', 'smtpFromEmail',
    'allowPublicRegistration', 'requireEmailVerification', 'require2FA',
    'passwordMinLength', 'passwordRequireUppercase', 'passwordRequireNumbers', 'passwordRequireSpecial',
    'accessTokenExpiryMinutes', 'refreshTokenExpiryDays', 'forceLogoutOnPasswordChange',
    'maxSessionsPerUser', 'maxFailedLoginAttempts', 'lockoutDurationMinutes', 'enableBruteForceProtection',
    'defaultPriority', 'allowFileUploads', 'allowedFileTypes', 'maxTasksPerUser', 'maxListsPerUser',
    'maxStoragePerUserMB',
    'enableOverdueNotifications', 'reminderOffsetMinutes',
    'enableBrowserNotifications', 'enableEmailReminders', 'enableDailySummary', 'enableWeeklySummary',
    'quietHoursStart', 'quietHoursEnd',
    'enableImpersonation', 'impersonationMaxMinutes', 'restrictImpersonateAdmins',
    'autoBackupFrequency', 'backupRetentionDays', 'maintenanceMode', 'maintenanceMessage',
    'enableCSP', 'enableHelmet', 'enableCSRF', 'forceSecureCookies',
    'enableApiAccess',
  ];

  const restartFields = new Set(['serverPort', 'forceHttps', 'enableCors', 'allowedOrigins']);

  editable.forEach((field) => {
    if (req.body[field] !== undefined && req.body[field] !== cfg[field]) {
      changes[field] = { old: cfg[field], new: req.body[field] };
      if (restartFields.has(field)) restartRequired.push(field);
      cfg[field] = req.body[field];
    }
  });

  await cfg.save();

  // Log SMTP changes separately
  const smtpChanged = Object.keys(changes).some((k) => k.startsWith('smtp'));
  if (smtpChanged) {
    await audit(req.user.id, 'update_smtp_config', 'smtp', {
      oldValue: Object.fromEntries(Object.entries(changes).filter(([k]) => k.startsWith('smtp')).map(([k, v]) => [k, v.old])),
      newValue: Object.fromEntries(Object.entries(changes).filter(([k]) => k.startsWith('smtp')).map(([k, v]) => [k, v.new])),
      ip: req.ip,
    });
  }

  if (Object.keys(changes).length > 0) {
    await audit(req.user.id, 'update_system_config', 'config', {
      oldValue: Object.fromEntries(Object.entries(changes).map(([k, v]) => [k, v.old])),
      newValue: Object.fromEntries(Object.entries(changes).map(([k, v]) => [k, v.new])),
      ip: req.ip,
    });
  }

  // Return without smtpPass
  const result = cfg.toObject();
  delete result.smtpPass;

  res.json({
    success: true,
    config: result,
    restartRequired: restartRequired.length > 0,
    restartFields: restartRequired,
  });
});

/**
 * POST /api/admin/config/test-email
 * Send a test email with current SMTP settings
 */
const sendTestEmail = asyncHandler(async (req, res) => {
  const { to } = req.body;
  if (!to) throw new AppError('Recipient email is required', 400);

  const cfg = await SystemConfig.getConfigWithSecrets();

  const transporter = nodemailer.createTransport({
    host: cfg.smtpHost,
    port: cfg.smtpPort,
    secure: cfg.smtpEncryption === 'ssl',
    auth: {
      user: cfg.smtpUser,
      pass: cfg.smtpPass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  await transporter.sendMail({
    from: `"${cfg.smtpFromName}" <${cfg.smtpFromEmail}>`,
    to,
    subject: 'Test Email - TaskManager',
    html: `<p>This is a test email from <strong>${cfg.appName || 'TaskManager'}</strong>.</p><p>SMTP is configured correctly.</p>`,
  });

  await audit(req.user.id, 'send_test_email', 'smtp', {
    details: `Test email sent to ${to}`,
    ip: req.ip,
  });

  res.json({ success: true, message: `Test email sent to ${to}` });
});

// ═══════════════════════════════════════════
// ════ IMPERSONATION ════
// ═══════════════════════════════════════════

/**
 * POST /api/admin/impersonate/:userId
 */
const impersonateUser = asyncHandler(async (req, res) => {
  const cfg = await SystemConfig.getConfig();
  if (!cfg.enableImpersonation) {
    throw new AppError('Impersonation is disabled', 403);
  }

  const targetUser = await User.findById(req.params.userId);
  if (!targetUser) throw new AppError('User not found', 404);

  if (cfg.restrictImpersonateAdmins && targetUser.role === 'admin') {
    throw new AppError('Cannot impersonate other admin accounts', 403);
  }

  // Generate a short-lived token as the target user, with impersonatedBy field
  const expiresIn = `${cfg.impersonationMaxMinutes || 60}m`;
  const token = jwt.sign(
    { userId: targetUser._id, impersonatedBy: req.user.id },
    config.jwtAccessSecret,
    { expiresIn }
  );

  await audit(req.user.id, 'impersonate_user', 'impersonation', {
    affectedUserId: targetUser._id,
    details: `Started impersonating ${targetUser.email}`,
    ip: req.ip,
  });

  res.json({
    success: true,
    accessToken: token,
    user: {
      id: targetUser._id,
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.role,
      impersonatedBy: req.user.id,
    },
  });
});

/**
 * POST /api/admin/stop-impersonation
 * Return to admin session
 */
const stopImpersonation = asyncHandler(async (req, res) => {
  const adminId = req.user.impersonatedBy;
  if (!adminId) {
    throw new AppError('You are not currently impersonating anyone', 400);
  }

  const admin = await User.findById(adminId);
  if (!admin) throw new AppError('Admin account not found', 404);

  const accessToken = generateAccessToken(admin._id);

  await audit(adminId, 'stop_impersonation', 'impersonation', {
    affectedUserId: req.user.id,
    details: `Stopped impersonating ${req.user.email}`,
    ip: req.ip,
  });

  res.json({
    success: true,
    accessToken,
    user: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
  });
});

// ═══════════════════════════════════════════
// ════ AUDIT LOGS ════
// ═══════════════════════════════════════════

/**
 * GET /api/admin/audit-logs
 */
const getAuditLogs = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.category) filter.category = req.query.category;
  if (req.query.action) filter.action = { $regex: req.query.action, $options: 'i' };
  if (req.query.from) filter.createdAt = { ...filter.createdAt, $gte: new Date(req.query.from) };
  if (req.query.to) filter.createdAt = { ...filter.createdAt, $lte: new Date(req.query.to) };

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .populate('adminId', 'name email')
      .populate('affectedUserId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments(filter),
  ]);

  res.json({
    success: true,
    logs,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// ═══════════════════════════════════════════
// ════ DATA MANAGEMENT ════
// ═══════════════════════════════════════════

/**
 * GET /api/admin/export/:type
 */
const exportData = asyncHandler(async (req, res) => {
  const { type } = req.params;
  let data;

  switch (type) {
    case 'users':
      data = await User.find().select('-password -refreshTokens -otp').lean();
      break;
    case 'tasks':
      data = await Task.find().lean();
      break;
    case 'lists':
      data = await TodoList.find().lean();
      break;
    default:
      throw new AppError('Invalid export type. Use: users, tasks, lists', 400);
  }

  await audit(req.user.id, `export_${type}`, 'data', {
    details: `Exported ${data.length} ${type}`,
    ip: req.ip,
  });

  res.json({ success: true, type, count: data.length, data });
});

/**
 * DELETE /api/admin/cleanup/completed
 * Delete completed tasks older than X days
 */
const cleanupCompletedTasks = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const result = await Task.deleteMany({
    completed: true,
    updatedAt: { $lt: cutoff },
  });

  await audit(req.user.id, 'cleanup_completed_tasks', 'data', {
    details: `Deleted ${result.deletedCount} completed tasks older than ${days} days`,
    ip: req.ip,
  });

  res.json({ success: true, deleted: result.deletedCount });
});

module.exports = {
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
};
