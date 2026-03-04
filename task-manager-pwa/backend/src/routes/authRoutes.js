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

module.exports = router;
