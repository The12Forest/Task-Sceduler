const cron = require('node-cron');
const Task = require('../models/Task');
const User = require('../models/User');
const { sendReminderEmail } = require('../services/emailService');

/**
 * Task Reminder Cron Job
 * Runs every day at 08:00 server time.
 * Finds all tasks with a dueDate of today that are not completed
 * and have not already been sent a reminder, then sends email notifications.
 */
const startReminderJob = () => {
  cron.schedule('0 8 * * *', async () => {
    console.log('[Reminder Job] Running task reminder check...');

    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

      // Find all non-completed tasks due today that haven't been reminded yet
      const tasks = await Task.find({
        dueDate: { $gte: startOfDay, $lt: endOfDay },
        completed: false,
        reminderSent: { $ne: true },
      }).lean();

      if (tasks.length === 0) {
        console.log('[Reminder Job] No tasks due today.');
        return;
      }

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

      console.log('[Reminder Job] Completed.');
    } catch (err) {
      console.error('[Reminder Job] Error:', err.message);
    }
  });

  console.log('Task reminder job scheduled (daily at 08:00).');
};

module.exports = { startReminderJob };
