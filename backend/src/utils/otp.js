const crypto = require('crypto');

/**
 * Hash an OTP for secure storage
 */
const hashOtp = (otp) => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

module.exports = { hashOtp };
