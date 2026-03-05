const mongoose = require('mongoose');
const Task = require('../models/Task');
const SystemConfig = require('../models/SystemConfig');

/**
 * Get total storage used by a user (in bytes).
 */
const getUserStorageUsed = async (userId) => {
  const result = await Task.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: null, total: { $sum: '$fileSize' } } },
  ]);
  return result.length > 0 ? result[0].total : 0;
};

/**
 * Check if adding `newFileSize` bytes would exceed the user's storage quota.
 * Returns { allowed, usedBytes, limitBytes }.
 */
const checkStorageQuota = async (userId, newFileSize) => {
  const cfg = await SystemConfig.getConfig();
  const limitBytes = (cfg.maxStoragePerUserMB || 50) * 1024 * 1024;
  const usedBytes = await getUserStorageUsed(userId);
  return {
    allowed: usedBytes + newFileSize <= limitBytes,
    usedBytes,
    limitBytes,
    limitMB: cfg.maxStoragePerUserMB || 50,
  };
};

module.exports = { getUserStorageUsed, checkStorageQuota };
