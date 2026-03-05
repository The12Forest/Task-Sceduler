import { useState, useEffect, useCallback } from 'react';
import { fetchSystemConfig, updateSystemConfig, sendTestEmail } from '../api/endpoints';
import { useSidebarOpen } from '../App';
import toast from 'react-hot-toast';

/* ─── Section Definitions ────────────────────────────────────── */
const sections = [
  { id: 'general', label: 'General', icon: '⚙️' },
  { id: 'environment', label: 'Environment', icon: '🌐' },
  { id: 'server', label: 'Server & Runtime', icon: '🖥️' },
  { id: 'smtp', label: 'SMTP / Email', icon: '✉️' },
  { id: 'auth', label: 'Authentication', icon: '🔐' },
  { id: 'tasks', label: 'Task System', icon: '📋' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
  { id: 'impersonation', label: 'Impersonation', icon: '🎭' },
  { id: 'backup', label: 'Backup & Maintenance', icon: '💾' },
  { id: 'security', label: 'Security Headers', icon: '🛡️' },
  { id: 'api', label: 'API Control', icon: '🔌' },
];

/* Field configs per section */
const fieldConfigs = {
  general: [
    { key: 'appName', label: 'Application Name', type: 'text' },
    { key: 'appLogoUrl', label: 'Logo URL', type: 'text', placeholder: 'https://...' },
    { key: 'appFaviconUrl', label: 'Favicon URL', type: 'text', placeholder: 'https://...' },
    { key: 'defaultLanguage', label: 'Default Language', type: 'text', placeholder: 'en' },
    { key: 'defaultTimezone', label: 'Default Timezone', type: 'text', placeholder: 'UTC' },
    { key: 'supportEmail', label: 'Support Email', type: 'text', placeholder: 'support@example.com' },
    { key: 'footerText', label: 'Footer Text', type: 'text' },
  ],
  environment: [], // Rendered specially — not using fieldConfigs
  server: [
    { key: 'serverPort', label: 'Port', type: 'number', restart: true },
    { key: 'baseUrl', label: 'Base URL', type: 'text', restart: true },
    { key: 'forceHttps', label: 'Force HTTPS', type: 'toggle', restart: true },
    { key: 'enableCors', label: 'Enable CORS', type: 'toggle' },
    { key: 'allowedOrigins', label: 'Allowed Origins', type: 'tags', help: 'Comma-separated' },
    { key: 'enableRequestLogging', label: 'Request Logging', type: 'toggle' },
    { key: 'logLevel', label: 'Log Level', type: 'select', options: ['error', 'warn', 'info', 'debug'] },
    { key: 'apiRateLimitPerMinute', label: 'Rate Limit (req/min)', type: 'number' },
    { key: 'maxUploadSizeMB', label: 'Max Upload Size (MB)', type: 'number' },
  ],
  smtp: [
    { key: 'smtpHost', label: 'SMTP Host', type: 'text' },
    { key: 'smtpPort', label: 'SMTP Port', type: 'number' },
    { key: 'smtpUser', label: 'SMTP Username', type: 'text' },
    { key: 'smtpPass', label: 'SMTP Password', type: 'password' },
    { key: 'smtpEncryption', label: 'Encryption', type: 'select', options: ['none', 'tls', 'ssl'] },
    { key: 'smtpFromName', label: 'From Name', type: 'text' },
    { key: 'smtpFromEmail', label: 'From Email', type: 'text' },
  ],
  auth: [
    { key: 'allowPublicRegistration', label: 'Allow Public Registration', type: 'toggle' },
    { key: 'requireEmailVerification', label: 'Require Email Verification', type: 'toggle' },
    { key: 'require2FA', label: 'Require 2FA (OTP)', type: 'toggle' },
    { key: 'passwordMinLength', label: 'Min Password Length', type: 'number' },
    { key: 'passwordRequireUppercase', label: 'Require Uppercase', type: 'toggle' },
    { key: 'passwordRequireNumbers', label: 'Require Numbers', type: 'toggle' },
    { key: 'passwordRequireSpecial', label: 'Require Special Chars', type: 'toggle' },
    { key: 'accessTokenExpiryMinutes', label: 'Access Token Expiry (min)', type: 'number' },
    { key: 'refreshTokenExpiryDays', label: 'Refresh Token Expiry (days)', type: 'number' },
    { key: 'forceLogoutOnPasswordChange', label: 'Force Logout on Password Change', type: 'toggle' },
    { key: 'maxSessionsPerUser', label: 'Max Sessions Per User', type: 'number' },
    { key: 'maxFailedLoginAttempts', label: 'Max Failed Login Attempts', type: 'number' },
    { key: 'lockoutDurationMinutes', label: 'Lockout Duration (min)', type: 'number' },
    { key: 'enableBruteForceProtection', label: 'Brute-force Protection', type: 'toggle' },
  ],
  tasks: [
    { key: 'defaultPriority', label: 'Default Priority', type: 'select', options: ['Low', 'Medium', 'High'] },
    { key: 'allowFileUploads', label: 'Allow File Uploads', type: 'toggle' },
    { key: 'allowedFileTypes', label: 'Allowed File Types', type: 'tags', help: 'Comma-separated extensions' },
    { key: 'maxTasksPerUser', label: 'Max Tasks Per User', type: 'number' },
    { key: 'maxListsPerUser', label: 'Max Lists Per User', type: 'number' },
    { key: 'maxStoragePerUserMB', label: 'Max Storage Per User (MB)', type: 'number' },
    { key: 'enableOverdueNotifications', label: 'Overdue Notifications', type: 'toggle' },
    { key: 'reminderOffsetMinutes', label: 'Reminder Offset (min)', type: 'number' },
  ],
  notifications: [
    { key: 'enableBrowserNotifications', label: 'Browser Notifications', type: 'toggle' },
    { key: 'enableEmailReminders', label: 'Email Reminders', type: 'toggle' },
    { key: 'enableDailySummary', label: 'Daily Summary', type: 'toggle' },
    { key: 'enableWeeklySummary', label: 'Weekly Summary', type: 'toggle' },
    { key: 'quietHoursStart', label: 'Quiet Hours Start', type: 'text', placeholder: '22:00' },
    { key: 'quietHoursEnd', label: 'Quiet Hours End', type: 'text', placeholder: '07:00' },
  ],
  impersonation: [
    { key: 'enableImpersonation', label: 'Enable Impersonation', type: 'toggle' },
    { key: 'impersonationMaxMinutes', label: 'Max Duration (min)', type: 'number' },
    { key: 'restrictImpersonateAdmins', label: 'Block Impersonating Other Admins', type: 'toggle' },
  ],
  backup: [
    { key: 'autoBackupFrequency', label: 'Auto-backup Frequency', type: 'select', options: ['daily', 'weekly', 'monthly', 'disabled'] },
    { key: 'backupRetentionDays', label: 'Retention (days)', type: 'number' },
    { key: 'maintenanceMode', label: 'Maintenance Mode', type: 'toggle' },
    { key: 'maintenanceMessage', label: 'Maintenance Message', type: 'text' },
  ],
  security: [
    { key: 'enableCSP', label: 'Content Security Policy', type: 'toggle' },
    { key: 'enableHelmet', label: 'Helmet Headers', type: 'toggle' },
    { key: 'enableCSRF', label: 'CSRF Protection', type: 'toggle' },
    { key: 'forceSecureCookies', label: 'Secure Cookies', type: 'toggle' },
  ],
  api: [
    { key: 'enableApiAccess', label: 'Enable API Access', type: 'toggle' },
  ],
};

/* ─── Field Components ───────────────────────────────────────── */
const FieldToggle = ({ value, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!value)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${value ? 'bg-primary-600' : 'bg-gray-600'}`}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);

const FieldInput = ({ type, value, onChange, placeholder }) => (
  <input
    type={type === 'password' ? 'password' : type === 'number' ? 'number' : 'text'}
    value={value ?? ''}
    onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
    placeholder={placeholder}
    className="w-full bg-dark-surface border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500"
  />
);

const FieldSelect = ({ value, options, onChange }) => (
  <select
    value={value ?? ''}
    onChange={(e) => onChange(e.target.value)}
    className="w-full bg-dark-surface border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500"
  >
    {options.map((o) => (
      <option key={o} value={o}>{o}</option>
    ))}
  </select>
);

const FieldTags = ({ value, onChange, help }) => {
  const str = Array.isArray(value) ? value.join(', ') : value ?? '';
  return (
    <div>
      <input
        type="text"
        value={str}
        onChange={(e) => onChange(e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
        className="w-full bg-dark-surface border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500"
      />
      {help && <p className="text-xs text-gray-500 mt-1">{help}</p>}
    </div>
  );
};

/* ─── Main Component ─────────────────────────────────────────── */
const AdminSettingsPage = () => {
  const openSidebar = useSidebarOpen();
  const [config, setConfig] = useState(null);
  const [envOverrides, setEnvOverrides] = useState({});
  const [dirty, setDirty] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('general');
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [sectionMenuOpen, setSectionMenuOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetchSystemConfig();
      setConfig(res.data.config);
      setEnvOverrides(res.data.envOverrides || {});
      setDirty({});
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load config');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleChange = (key, val) => {
    setConfig((prev) => ({ ...prev, [key]: val }));
    setDirty((prev) => ({ ...prev, [key]: true }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {};
      Object.keys(dirty).forEach((k) => { payload[k] = config[k]; });
      const res = await updateSystemConfig(payload);
      toast.success('Settings saved');
      if (res.data.restartRequired) {
        toast('Server restart recommended for some changes to take effect', { icon: '⚠️', duration: 5000 });
      }
      setDirty({});
      // Refresh from server to ensure consistency
      const fresh = await fetchSystemConfig();
      setConfig(fresh.data.config);
      setEnvOverrides(fresh.data.envOverrides || {});
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) return toast.error('Enter a recipient email');
    setSendingTest(true);
    try {
      await sendTestEmail(testEmail);
      toast.success('Test email sent!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send test email');
    } finally {
      setSendingTest(false);
    }
  };

  const dirtyCount = Object.keys(dirty).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const fields = fieldConfigs[activeSection] || [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={openSidebar}
          className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-dark-surface rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">System Settings</h1>
          <p className="text-gray-400 mt-1">Configure your TaskManager instance</p>
        </div>
        {dirtyCount > 0 && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : `Save (${dirtyCount})`}
          </button>
        )}
      </div>

      {/* Section Nav — hamburger dropdown on mobile, horizontal tabs on desktop */}
      <div className="relative mb-6 pb-4 border-b border-dark-border">
        {/* Mobile: current section button + dropdown */}
        <div className="md:hidden">
          <button
            onClick={() => setSectionMenuOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-dark-surface border border-dark-border rounded-lg text-sm font-medium text-white"
          >
            <span className="flex items-center gap-2">
              <span>{sections.find((s) => s.id === activeSection)?.icon}</span>
              {sections.find((s) => s.id === activeSection)?.label}
            </span>
            <svg className={`w-4 h-4 text-gray-400 transition-transform ${sectionMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {sectionMenuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setSectionMenuOpen(false)} />
              <div className="absolute left-0 right-0 mt-1 bg-dark-card border border-dark-border rounded-xl shadow-2xl z-40 py-1 max-h-[60vh] overflow-y-auto">
                {sections.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setActiveSection(s.id); setSectionMenuOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors ${
                      activeSection === s.id
                        ? 'bg-primary-600/20 text-primary-400'
                        : 'text-gray-400 hover:bg-dark-surface hover:text-white'
                    }`}
                  >
                    <span>{s.icon}</span>
                    {s.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Desktop: horizontal tabs */}
        <div className="hidden md:flex flex-wrap gap-2">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeSection === s.id
                  ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-dark-surface border border-transparent'
              }`}
            >
              <span>{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Fields */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-6 space-y-5">
        {/* Environment variables (read-only) */}
        {activeSection === 'environment' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-400 mb-4">
              These values are set via <code className="bg-dark-surface px-1 rounded text-primary-400">.env</code> or Docker environment variables and cannot be changed from the UI.
            </p>
            {Object.entries(envOverrides).map(([key, value]) => (
              <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="sm:w-56 flex-shrink-0">
                  <label className="text-sm text-gray-300 font-medium">{key}</label>
                </div>
                <div className="flex-1">
                  <div className="w-full bg-dark-surface border border-dark-border rounded-lg px-3 py-2 text-gray-400 text-sm">
                    {value || <span className="italic text-gray-600">not set</span>}
                  </div>
                </div>
                <span className="text-xs text-gray-600">read-only</span>
              </div>
            ))}
          </div>
        )}

        {/* Regular editable fields */}
        {activeSection !== 'environment' && fields.map((f) => (
          <div key={f.key} className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="sm:w-56 flex-shrink-0">
              <label className="text-sm text-gray-300 font-medium">
                {f.label}
                {f.restart && <span className="text-yellow-500 text-xs ml-1" title="Requires restart">⟳</span>}
              </label>
            </div>
            <div className="flex-1">
              {f.type === 'toggle' ? (
                <FieldToggle value={config?.[f.key]} onChange={(v) => handleChange(f.key, v)} />
              ) : f.type === 'select' ? (
                <FieldSelect value={config?.[f.key]} options={f.options} onChange={(v) => handleChange(f.key, v)} />
              ) : f.type === 'tags' ? (
                <FieldTags value={config?.[f.key]} onChange={(v) => handleChange(f.key, v)} help={f.help} />
              ) : (
                <FieldInput type={f.type} value={config?.[f.key]} onChange={(v) => handleChange(f.key, v)} placeholder={f.placeholder} />
              )}
            </div>
            {dirty[f.key] && <span className="text-xs text-yellow-400">Modified</span>}
          </div>
        ))}

        {/* SMTP Test Email */}
        {activeSection === 'smtp' && (
          <div className="pt-4 border-t border-dark-border">
            <h4 className="text-white font-medium mb-3">Test Email</h4>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="recipient@example.com"
                className="flex-1 bg-dark-surface border border-dark-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500"
              />
              <button
                onClick={handleTestEmail}
                disabled={sendingTest}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {sendingTest ? 'Sending…' : 'Send Test'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSettingsPage;
