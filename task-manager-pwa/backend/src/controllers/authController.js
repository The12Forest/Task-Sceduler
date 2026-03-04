const bcrypt = require('bcryptjs');
const User = require('../models/User');
const TodoList = require('../models/TodoList');
const SystemConfig = require('../models/SystemConfig');
const { AppError } = require('../middlewares/errorHandler');
const asyncHandler = require('../utils/asyncHandler');
const { generateOtp, hashOtp } = require('../utils/otp');
const { generateTotpSecret, verifyTotpToken, generateQrDataUrl } = require('../utils/totp');
const {
  generateAccessToken,
  generateRefreshToken,
  generateVerificationToken,
  verifyAccessToken,
  verifyRefreshToken,
} = require('../services/tokenService');
const { sendVerificationEmail, sendOtpEmail } = require('../services/emailService');

/**
 * POST /api/auth/register
 * Register a new user and send email verification link
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Check if public registration is allowed
  const sysConfig = await SystemConfig.getConfig();
  if (!sysConfig.allowPublicRegistration) {
    throw new AppError('Public registration is currently disabled', 403);
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('Email already registered', 409);
  }

  const user = await User.create({ name, email, password });

  // Auto-create the default list for this user
  await TodoList.create({ userId: user._id, name: 'My Tasks', isDefault: true });

  // Generate verification token (15 min)
  const verificationToken = generateVerificationToken(user._id);
  await sendVerificationEmail(email, verificationToken);

  res.status(201).json({
    success: true,
    message: 'Registration successful. Please check your email to verify your account.',
  });
});

/**
 * GET /api/auth/verify-email?token=xxx
 * Verify email address
 */
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.query;
  if (!token) throw new AppError('Verification token is required', 400);

  const decoded = verifyAccessToken(token);
  if (decoded.purpose !== 'email-verification') {
    throw new AppError('Invalid verification token', 400);
  }

  const user = await User.findById(decoded.userId);
  if (!user) throw new AppError('User not found', 404);

  if (user.isVerified) {
    return res.json({ success: true, message: 'Email already verified' });
  }

  user.isVerified = true;
  await user.save();

  res.json({ success: true, message: 'Email verified successfully. You can now log in.' });
});

/**
 * POST /api/auth/login
 * Step 1: Validate credentials, generate OTP, send via email
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new AppError('Invalid email or password', 401);

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new AppError('Invalid email or password', 401);

  if (!user.isVerified) {
    throw new AppError('Please verify your email before logging in', 403);
  }

  // If 2FA is enabled, skip OTP email — frontend will ask for TOTP code
  if (user.twoFactorEnabled) {
    return res.json({
      success: true,
      twoFactorRequired: true,
      message: 'Please enter your authenticator code.',
    });
  }

  // Otherwise, send email OTP as before
  const otp = generateOtp();
  const hashedOtp = hashOtp(otp);

  await User.findByIdAndUpdate(user._id, {
    'otp.code': hashedOtp,
    'otp.expiresAt': new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
  });

  await sendOtpEmail(email, otp);

  res.json({
    success: true,
    message: 'OTP sent to your email. Please verify to complete login.',
  });
});

/**
 * POST /api/auth/verify-otp
 * Step 2: Validate OTP and issue tokens
 */
const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email }).select('+refreshTokens +totpSecret');
  if (!user) throw new AppError('User not found', 404);

  // If 2FA is enabled, verify TOTP code instead of email OTP
  if (user.twoFactorEnabled) {
    if (!otp) throw new AppError('Authenticator code is required', 400);
    const valid = verifyTotpToken(otp, user.totpSecret);
    if (!valid) throw new AppError('Invalid authenticator code', 401);
  } else {
    // Standard email OTP verification
    if (!user.otp || !user.otp.code || !user.otp.expiresAt) {
      throw new AppError('No OTP pending. Please login again.', 400);
    }

    if (new Date() > user.otp.expiresAt) {
      user.otp = { code: null, expiresAt: null };
      await user.save();
      throw new AppError('OTP has expired. Please login again.', 400);
    }

    const hashedInput = hashOtp(otp);
    if (hashedInput !== user.otp.code) {
      throw new AppError('Invalid OTP', 401);
    }

    // Clear OTP
    user.otp = { code: null, expiresAt: null };
  }

  // Generate tokens
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Store refresh token
  user.refreshTokens.push(refreshToken);
  // Keep only last 5 refresh tokens
  if (user.refreshTokens.length > 5) {
    user.refreshTokens = user.refreshTokens.slice(-5);
  }

  // Track login
  user.lastLoginAt = new Date();
  user.lastLoginIp = req.ip || req.connection?.remoteAddress || null;
  user.failedLoginAttempts = 0;

  await user.save();

  // Set refresh token as httpOnly cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.json({
    success: true,
    accessToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword || false,
      twoFactorEnabled: user.twoFactorEnabled || false,
      preferences: user.preferences,
    },
  });
});

/**
 * POST /api/auth/refresh
 * Issue a new access token using a valid refresh token
 */
const refreshAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.cookies;
  if (!refreshToken) throw new AppError('Refresh token not provided', 401);

  const decoded = verifyRefreshToken(refreshToken);
  const user = await User.findById(decoded.userId).select('+refreshTokens');
  if (!user) throw new AppError('User not found', 401);

  // Check if refresh token is in user's stored tokens
  if (!user.refreshTokens.includes(refreshToken)) {
    throw new AppError('Invalid refresh token', 401);
  }

  // Rotate: remove old, issue new
  user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);

  const newAccessToken = generateAccessToken(user._id);
  const newRefreshToken = generateRefreshToken(user._id);
  user.refreshTokens.push(newRefreshToken);
  await user.save();

  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ success: true, accessToken: newAccessToken });
});

/**
 * POST /api/auth/logout
 * Invalidate refresh token
 */
const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.cookies;

  if (refreshToken) {
    try {
      const decoded = verifyRefreshToken(refreshToken);
      const user = await User.findById(decoded.userId).select('+refreshTokens');
      if (user) {
        user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
        await user.save();
      }
    } catch {
      // Token already invalid, just clear cookie
    }
  }

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  res.json({ success: true, message: 'Logged out successfully' });
});

/**
 * GET /api/auth/me
 * Get current user info
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new AppError('User not found', 404);

  res.json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword || false,
      twoFactorEnabled: user.twoFactorEnabled || false,
      preferences: user.preferences,
      impersonatedBy: req.user.impersonatedBy || null,
    },
  });
});

/**
 * PUT /api/auth/change-password
 * Change password (requires current password)
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Cannot change password while impersonating
  if (req.user.impersonatedBy) {
    throw new AppError('Cannot change password while impersonating', 403);
  }

  const user = await User.findById(req.user.id).select('+password');
  if (!user) throw new AppError('User not found', 404);

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new AppError('Current password is incorrect', 401);

  user.password = newPassword;
  user.mustChangePassword = false;
  await user.save();

  res.json({ success: true, message: 'Password changed successfully' });
});

/**
 * PUT /api/auth/change-email
 * Change email (requires password confirmation, triggers re-verification)
 */
const changeEmail = asyncHandler(async (req, res) => {
  const { password, newEmail } = req.body;

  if (req.user.impersonatedBy) {
    throw new AppError('Cannot change email while impersonating', 403);
  }

  const user = await User.findById(req.user.id).select('+password');
  if (!user) throw new AppError('User not found', 404);

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new AppError('Password is incorrect', 401);

  const existing = await User.findOne({ email: newEmail.toLowerCase() });
  if (existing) throw new AppError('Email already in use', 409);

  user.email = newEmail.toLowerCase();
  user.isVerified = false;
  await user.save();

  const verificationToken = generateVerificationToken(user._id);
  await sendVerificationEmail(newEmail, verificationToken);

  res.json({ success: true, message: 'Email changed. Please verify your new email.' });
});

/**
 * PUT /api/auth/preferences
 * Update user UI preferences
 */
const updatePreferences = asyncHandler(async (req, res) => {
  const allowed = ['theme', 'sidebarCollapsed', 'defaultPage', 'taskView'];
  const updates = {};
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) {
      updates[`preferences.${key}`] = req.body[key];
    }
  });

  const user = await User.findByIdAndUpdate(req.user.id, { $set: updates }, { new: true });
  if (!user) throw new AppError('User not found', 404);

  res.json({ success: true, preferences: user.preferences });
});

/**
 * POST /api/auth/totp/setup
 * Generate TOTP secret and QR code for the authenticated user
 */
const setupTotp = asyncHandler(async (req, res) => {
  if (req.user.impersonatedBy) {
    throw new AppError('Cannot setup 2FA while impersonating', 403);
  }

  const user = await User.findById(req.user.id);
  if (!user) throw new AppError('User not found', 404);

  if (user.twoFactorEnabled) {
    throw new AppError('Two-factor authentication is already enabled', 400);
  }

  const { secret, otpauthUrl } = generateTotpSecret(user.email);
  const qrCodeDataUrl = await generateQrDataUrl(otpauthUrl);

  // Store the secret temporarily (not yet enabled until verified)
  await User.findByIdAndUpdate(user._id, { totpSecret: secret });

  res.json({
    success: true,
    secret,
    qrCode: qrCodeDataUrl,
  });
});

/**
 * POST /api/auth/totp/verify-setup
 * Verify TOTP code to enable 2FA
 */
const verifyTotpSetup = asyncHandler(async (req, res) => {
  if (req.user.impersonatedBy) {
    throw new AppError('Cannot setup 2FA while impersonating', 403);
  }

  const { token } = req.body;
  if (!token) throw new AppError('Authenticator code is required', 400);

  const user = await User.findById(req.user.id).select('+totpSecret');
  if (!user) throw new AppError('User not found', 404);

  if (!user.totpSecret) {
    throw new AppError('No TOTP setup in progress. Please call setup first.', 400);
  }

  const valid = verifyTotpToken(token, user.totpSecret);
  if (!valid) {
    throw new AppError('Invalid authenticator code. Please try again.', 401);
  }

  user.twoFactorEnabled = true;
  await user.save();

  res.json({
    success: true,
    message: 'Two-factor authentication enabled successfully.',
  });
});

/**
 * POST /api/auth/totp/disable
 * Disable 2FA (requires password confirmation)
 */
const disableTotp = asyncHandler(async (req, res) => {
  if (req.user.impersonatedBy) {
    throw new AppError('Cannot disable 2FA while impersonating', 403);
  }

  const { password } = req.body;
  if (!password) throw new AppError('Password is required to disable 2FA', 400);

  const user = await User.findById(req.user.id).select('+password');
  if (!user) throw new AppError('User not found', 404);

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new AppError('Password is incorrect', 401);

  user.twoFactorEnabled = false;
  user.totpSecret = null;
  await user.save();

  res.json({
    success: true,
    message: 'Two-factor authentication disabled.',
  });
});

module.exports = {
  register,
  verifyEmail,
  login,
  verifyOtp,
  refreshAccessToken,
  logout,
  getMe,
  changePassword,
  changeEmail,
  updatePreferences,
  setupTotp,
  verifyTotpSetup,
  disableTotp,
};
