const nodemailer = require('nodemailer');
const config = require('../config');
const SystemConfig = require('../models/SystemConfig');

/* ── Cached transporter (refreshes every 60 s or when SMTP config changes) ── */
let _cached = null;
let _cacheExpiry = 0;
const CACHE_TTL = 60_000; // 60 seconds

const getTransporter = async () => {
  if (_cached && Date.now() < _cacheExpiry) return _cached;

  try {
    const cfg = await SystemConfig.getConfigWithSecrets();
    if (cfg.smtpHost && cfg.smtpUser) {
      _cached = {
        transporter: nodemailer.createTransport({
          host: cfg.smtpHost,
          port: cfg.smtpPort || 587,
          secure: cfg.smtpEncryption === 'ssl',
          auth: { user: cfg.smtpUser, pass: cfg.smtpPass || '' },
          tls: { rejectUnauthorized: false },
        }),
        from: `"${cfg.smtpFromName || 'Task Manager'}" <${cfg.smtpFromEmail || cfg.smtpUser}>`,
        appName: cfg.appName || 'Task Manager',
      };
      _cacheExpiry = Date.now() + CACHE_TTL;
      return _cached;
    }
  } catch { /* fall through to .env */ }

  // Fallback to .env values
  _cached = {
    transporter: nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: false,
      auth: { user: config.smtp.user, pass: config.smtp.pass },
      tls: { rejectUnauthorized: false },
    }),
    from: `"Task Manager" <${config.smtp.from}>`,
    appName: 'Task Manager',
  };
  _cacheExpiry = Date.now() + CACHE_TTL;
  return _cached;
};

/**
 * Send email verification link
 */
const sendVerificationEmail = async (email, token) => {
  const { transporter, from, appName } = await getTransporter();
  const verifyUrl = `${config.clientUrl}/verify-email?token=${token}`;

  await transporter.sendMail({
    from,
    to: email,
    subject: 'Verify your email address',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;background:#1a1a2e;color:#e0e0e0;border-radius:12px;">
        <h2 style="color:#7c3aed;">Welcome to ${appName}!</h2>
        <p>Please verify your email by clicking the link below. It expires in 15 minutes.</p>
        <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:8px;margin:16px 0;">Verify Email</a>
        <p style="font-size:12px;color:#888;">If you didn't create an account, you can ignore this email.</p>
      </div>
    `,
  });
};

/**
 * Send task reminder email
 */
const sendReminderEmail = async (email, tasks) => {
  const { transporter, from, appName } = await getTransporter();

  const taskList = tasks
    .map(
      (t) =>
        `<li style="padding:6px 0;border-bottom:1px solid #2a2a3e;">
          <strong style="color:#e0e0e0;">${t.name}</strong>
          ${t.priority ? `<span style="color:#7c3aed;font-size:12px;margin-left:8px;">[${t.priority}]</span>` : ''}
          ${t.dueDate ? `<br/><span style="font-size:12px;color:#888;">Due: ${new Date(t.dueDate).toLocaleDateString()}</span>` : ''}
        </li>`
    )
    .join('');

  await transporter.sendMail({
    from,
    to: email,
    subject: `🔔 You have ${tasks.length} task${tasks.length > 1 ? 's' : ''} due today`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;background:#1a1a2e;color:#e0e0e0;border-radius:12px;">
        <h2 style="color:#7c3aed;">Task Reminder</h2>
        <p>You have <strong>${tasks.length}</strong> task${tasks.length > 1 ? 's' : ''} due today:</p>
        <ul style="list-style:none;padding:0;margin:16px 0;">${taskList}</ul>
        <p style="font-size:12px;color:#888;">This is an automated reminder from ${appName}.</p>
      </div>
    `,
  });
};

module.exports = { sendVerificationEmail, sendReminderEmail };
