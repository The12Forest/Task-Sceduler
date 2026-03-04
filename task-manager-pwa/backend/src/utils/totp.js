const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

/**
 * Generate a new TOTP secret
 * @param {string} email - User's email for the authenticator label
 * @returns {{ secret: string, otpauthUrl: string }}
 */
const generateTotpSecret = (email) => {
  const secret = speakeasy.generateSecret({
    name: `TaskManager (${email})`,
    issuer: 'TaskManager',
    length: 20,
  });
  return {
    secret: secret.base32,
    otpauthUrl: secret.otpauth_url,
  };
};

/**
 * Verify a TOTP token against a secret
 * @param {string} token - The 6-digit code from the authenticator app
 * @param {string} secret - The base32 secret
 * @returns {boolean}
 */
const verifyTotpToken = (token, secret) => {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 1, // Allow 1 step tolerance (30s before/after)
  });
};

/**
 * Generate a QR code data URL from an otpauth URL
 * @param {string} otpauthUrl
 * @returns {Promise<string>} - Data URL (base64 PNG)
 */
const generateQrDataUrl = async (otpauthUrl) => {
  return QRCode.toDataURL(otpauthUrl);
};

module.exports = { generateTotpSecret, verifyTotpToken, generateQrDataUrl };
