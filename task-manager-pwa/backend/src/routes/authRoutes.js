const express = require('express');
const router = express.Router();

const {
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
} = require('../controllers/authController');

const { protect } = require('../middlewares/auth');
const { loginLimiter, otpLimiter } = require('../middlewares/rateLimiter');
const {
  validate,
  registerSchema,
  loginSchema,
  otpSchema,
} = require('../middlewares/validation');

router.post('/register', validate(registerSchema), register);
router.get('/verify-email', verifyEmail);
router.post('/login', loginLimiter, validate(loginSchema), login);
router.post('/verify-otp', otpLimiter, validate(otpSchema), verifyOtp);
router.post('/refresh', refreshAccessToken);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);
router.put('/change-email', protect, changeEmail);
router.put('/preferences', protect, updatePreferences);

// TOTP / 2FA routes
router.post('/totp/setup', protect, setupTotp);
router.post('/totp/verify-setup', protect, verifyTotpSetup);
router.post('/totp/disable', protect, disableTotp);

module.exports = router;
