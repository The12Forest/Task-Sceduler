const cron = require('node-cron');
const Task = require('../models/Task');

/**
 * Self-destruct cleanup job.
 * Runs every 15 seconds to delete tasks whose selfDestructAt has passed.
 */
const startSelfDestructJob = () => {
  // Run every 15 seconds
  cron.schedule('*/15 * * * * *', async () => {
    try {
      const now = new Date();
      const result = await Task.deleteMany({
        selfDestructAt: { $ne: null, $lte: now },
      });
      if (result.deletedCount > 0) {
        console.log(`[Self-Destruct] Burned ${result.deletedCount} task(s)`);
      }
    } catch (err) {
      console.error('[Self-Destruct] Error:', err.message);
    }
  });

  console.log('Self-destruct cleanup job started (every 15s)');
};

module.exports = { startSelfDestructJob };
