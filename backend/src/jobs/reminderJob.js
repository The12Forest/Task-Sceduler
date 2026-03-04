const cron = require('node-cron');
const Task = require('../models/Task');
const User = require('../models/User');
const SystemConfig = require('../models/SystemConfig');
const { sendReminderEmail } = require('../services/emailService');

/**
 * Task Reminder Cron Job
 * Runs every 15 minutes.
 * Respects enableEmailReminders and reminderOffsetMinutes from SystemConfig.
 */
const startReminderJob = () => {
  cron.schedule('*/15 * * * *', async () => {
    try {
      const cfg = await SystemConfig.getConfig();

      // Bail out if email reminders are disabled
      if (!cfg.enableEmailReminders) return;

      const offsetMs = (cfg.reminderOffsetMinutes || 60) * 60 * 1000;
      const now = new Date();

      // Find tasks due within the offset window that haven't been reminded
      const windowEnd = new Date(now.getTime() + offsetMs);

      const tasks = await Task.find({
        dueDate: { $gte: now, $lte: windowEnd },
        completed: false,
        reminderSent: { $ne: true },
      }).lean();

      if (tasks.length === 0) return;

      // Group tasks by userId
      const tasksByUser = {};
      for (const task of tasks) {
        const uid = task.userId.toString();
        if (!tasksByUser[uid]) tasksByUser[uid] = [];
        tasksByUser[uid].push(task);
      }

      // Send emails per user
      for (const [userId, userTasks] of Object.entries(tasksByUser)) {
        try {
          const user = await User.findById(userId);
          if (!user || !user.isActive) continue;

          await sendReminderEmail(user.email, userTasks);

          // Mark tasks as reminded
          const taskIds = userTasks.map((t) => t._id);
          await Task.updateMany(
            { _id: { $in: taskIds } },
            { $set: { reminderSent: true } }
          );

          console.log(`[Reminder Job] Sent ${userTasks.length} reminder(s) to ${user.email}`);
        } catch (err) {
          console.error(`[Reminder Job] Failed to notify user ${userId}:`, err.message);
        }
      }
    } catch (err) {
      console.error('[Reminder Job] Error:', err.message);
    }
  });

  console.log('Task reminder job scheduled (every 15 minutes).');
};

module.exports = { startReminderJob };
