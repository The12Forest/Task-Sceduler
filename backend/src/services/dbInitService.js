const mongoose = require('mongoose');
const config = require('../config');
const SystemConfig = require('../models/SystemConfig');

/**
 * Connect to MongoDB and ensure SystemConfig singleton exists.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongoUri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Ensure the SystemConfig singleton document exists.
 */
const initSystemConfig = async () => {
  try {
    await SystemConfig.getConfig();
    console.log('System configuration loaded.');
  } catch (err) {
    console.error('Failed to initialize system config:', err.message);
  }
};

module.exports = { connectDB, initSystemConfig };
