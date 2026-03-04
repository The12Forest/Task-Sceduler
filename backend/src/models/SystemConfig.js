const mongoose = require('mongoose');

/**
 * Singleton system configuration document.
 * Only one document should exist (enforced by key = 'global').
 */
const systemConfigSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'global',
      unique: true,
      immutable: true,
    },

    // ── Application Identity ──
    appName: { type: String, default: 'TaskManager' },
    appLogoUrl: { type: String, default: null },
    appFaviconUrl: { type: String, default: null },
    defaultLanguage: { type: String, default: 'en' },
    defaultTimezone: { type: String, default: 'UTC' },
    supportEmail: { type: String, default: '' },
    footerText: { type: String, default: '' },

    // ── Server & Runtime ──
    serverPort: { type: Number, default: 5000 },
    baseUrl: { type: String, default: 'http://localhost:5000' },
    forceHttps: { type: Boolean, default: false },
    enableCors: { type: Boolean, default: true },
    allowedOrigins: { type: [String], default: ['http://localhost:5173'] },
    enableRequestLogging: { type: Boolean, default: true },
    logLevel: { type: String, enum: ['error', 'warn', 'info', 'debug'], default: 'info' },
    apiRateLimitPerMinute: { type: Number, default: 100 },
    maxUploadSizeMB: { type: Number, default: 5 },

    // ── SMTP / Email ──
    smtpHost: { type: String, default: '' },
    smtpPort: { type: Number, default: 587 },
    smtpUser: { type: String, default: '' },
    smtpPass: { type: String, default: '', select: false },
    smtpEncryption: { type: String, enum: ['none', 'tls', 'ssl'], default: 'tls' },
    smtpFromName: { type: String, default: 'Task Manager' },
    smtpFromEmail: { type: String, default: 'noreply@taskmanager.app' },

    // ── Authentication & Security ──
    allowPublicRegistration: { type: Boolean, default: true },
    requireEmailVerification: { type: Boolean, default: true },
    require2FA: { type: Boolean, default: true },
    passwordMinLength: { type: Number, default: 8 },
    passwordRequireUppercase: { type: Boolean, default: false },
    passwordRequireNumbers: { type: Boolean, default: false },
    passwordRequireSpecial: { type: Boolean, default: false },
    accessTokenExpiryMinutes: { type: Number, default: 15 },
    refreshTokenExpiryDays: { type: Number, default: 7 },
    forceLogoutOnPasswordChange: { type: Boolean, default: true },
    maxSessionsPerUser: { type: Number, default: 5 },
    maxFailedLoginAttempts: { type: Number, default: 5 },
    lockoutDurationMinutes: { type: Number, default: 15 },
    enableBruteForceProtection: { type: Boolean, default: true },

    // ── Task System ──
    defaultPriority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    allowFileUploads: { type: Boolean, default: true },
    allowedFileTypes: { type: [String], default: ['pdf', 'png', 'jpg', 'jpeg'] },
    maxTasksPerUser: { type: Number, default: 1000 },
    maxListsPerUser: { type: Number, default: 50 },
    enableOverdueNotifications: { type: Boolean, default: true },
    reminderOffsetMinutes: { type: Number, default: 60 },

    // ── Notifications ──
    enableBrowserNotifications: { type: Boolean, default: true },
    enableEmailReminders: { type: Boolean, default: false },
    enableDailySummary: { type: Boolean, default: false },
    enableWeeklySummary: { type: Boolean, default: false },
    quietHoursStart: { type: String, default: '22:00' },
    quietHoursEnd: { type: String, default: '07:00' },

    // ── Impersonation ──
    enableImpersonation: { type: Boolean, default: true },
    impersonationMaxMinutes: { type: Number, default: 60 },
    restrictImpersonateAdmins: { type: Boolean, default: true },

    // ── Backup & Maintenance ──
    autoBackupFrequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'disabled'], default: 'disabled' },
    backupRetentionDays: { type: Number, default: 30 },
    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: { type: String, default: 'System is under maintenance. Please try again later.' },

    // ── Security Headers ──
    enableCSP: { type: Boolean, default: true },
    enableHelmet: { type: Boolean, default: true },
    enableCSRF: { type: Boolean, default: false },
    forceSecureCookies: { type: Boolean, default: false },

    // ── API Control ──
    enableApiAccess: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

/**
 * Static helper: get the singleton config, creating it if needed.
 */
systemConfigSchema.statics.getConfig = async function () {
  let config = await this.findOne({ key: 'global' });
  if (!config) {
    config = await this.create({ key: 'global' });
  }
  return config;
};

/**
 * Static helper: get config with SMTP password visible.
 */
systemConfigSchema.statics.getConfigWithSecrets = async function () {
  let config = await this.findOne({ key: 'global' }).select('+smtpPass');
  if (!config) {
    config = await this.create({ key: 'global' });
    config = await this.findOne({ key: 'global' }).select('+smtpPass');
  }
  return config;
};

module.exports = mongoose.model('SystemConfig', systemConfigSchema);
