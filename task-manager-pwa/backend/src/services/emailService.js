const nodemailer = require('nodemailer');
const config = require('../config');

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: false,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

/**
 * Send email verification link
 */
const sendVerificationEmail = async (email, token) => {
  const verifyUrl = `${config.clientUrl}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: `"Task Manager" <${config.smtp.from}>`,
    to: email,
    subject: 'Verify your email address',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;background:#1a1a2e;color:#e0e0e0;border-radius:12px;">
        <h2 style="color:#7c3aed;">Welcome to Task Manager!</h2>
        <p>Please verify your email by clicking the link below. It expires in 15 minutes.</p>
        <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:8px;margin:16px 0;">Verify Email</a>
        <p style="font-size:12px;color:#888;">If you didn't create an account, you can ignore this email.</p>
      </div>
    `,
  });
};

/**
 * Send OTP code via email
 */
const sendOtpEmail = async (email, otp) => {
  await transporter.sendMail({
    from: `"Task Manager" <${config.smtp.from}>`,
    to: email,
    subject: 'Your login verification code',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;background:#1a1a2e;color:#e0e0e0;border-radius:12px;">
        <h2 style="color:#7c3aed;">Login Verification</h2>
        <p>Your one-time verification code is:</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center;padding:16px;background:#16213e;border-radius:8px;color:#7c3aed;">${otp}</div>
        <p>This code expires in 5 minutes.</p>
        <p style="font-size:12px;color:#888;">If you didn't request this, please ignore this email.</p>
      </div>
    `,
  });
};

/**
 * Send task reminder email
 */
const sendReminderEmail = async (email, tasks) => {
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
    from: `"Task Manager" <${config.smtp.from}>`,
    to: email,
    subject: `🔔 You have ${tasks.length} task${tasks.length > 1 ? 's' : ''} due today`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;background:#1a1a2e;color:#e0e0e0;border-radius:12px;">
        <h2 style="color:#7c3aed;">Task Reminder</h2>
        <p>You have <strong>${tasks.length}</strong> task${tasks.length > 1 ? 's' : ''} due today:</p>
        <ul style="list-style:none;padding:0;margin:16px 0;">${taskList}</ul>
        <p style="font-size:12px;color:#888;">This is an automated reminder from Task Manager.</p>
      </div>
    `,
  });
};

module.exports = { sendVerificationEmail, sendOtpEmail, sendReminderEmail };
