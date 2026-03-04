const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const config = require('./config');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const listRoutes = require('./routes/listRoutes');
const adminRoutes = require('./routes/adminRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const User = require('./models/User');
const TodoList = require('./models/TodoList');
const SystemConfig = require('./models/SystemConfig');
const { startReminderJob } = require('./jobs/reminderJob');

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  })
);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '..', '..', 'frontend', 'dist');
  app.use(express.static(frontendPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// Error handling
app.use(notFound);
app.use(errorHandler);

/**
 * Seed default admin account if no admin exists.
 * If admin exists, sync email from ADMIN_EMAIL env var on every start.
 */
const seedDefaultAdmin = async () => {
  try {
    const adminEmail = config.adminEmail;
    const adminExists = await User.findOne({ role: 'admin' });

    if (adminExists) {
      // Sync admin email from env var on every start
      if (adminExists.email !== adminEmail) {
        adminExists.email = adminEmail;
        await adminExists.save();
        console.log(`Admin email synced to: ${adminEmail}`);
      }
      return;
    }

    // Create default admin with password 'admin' — must change on first login
    const admin = await User.create({
      name: 'Administrator',
      email: adminEmail,
      password: 'admin1234',
      role: 'admin',
      isVerified: true,
      mustChangePassword: true,
      twoFactorEnabled: false,
    });

    await TodoList.create({ userId: admin._id, name: 'My Tasks', isDefault: true });

    console.log('╔══════════════════════════════════════════════╗');
    console.log('║       DEFAULT ADMIN ACCOUNT CREATED          ║');
    console.log('╠══════════════════════════════════════════════╣');
    console.log(`║  Email:    ${adminEmail.padEnd(33)}║`);
    console.log(`║  Password: admin1234                         ║`);
    console.log('║                                              ║');
    console.log('║  ⚠  You MUST change this password on login!  ║');
    console.log('╚══════════════════════════════════════════════╝');
  } catch (err) {
    console.error('Failed to seed admin:', err.message);
  }
};

/**
 * Ensure SystemConfig singleton exists
 */
const initSystemConfig = async () => {
  try {
    await SystemConfig.getConfig();
    console.log('System configuration loaded.');
  } catch (err) {
    console.error('Failed to initialize system config:', err.message);
  }
};

// Start server
const start = async () => {
  await connectDB();
  await seedDefaultAdmin();
  await initSystemConfig();

  // Start task reminder cron job
  startReminderJob();

  const port = config.port;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
};

start();

module.exports = app;
