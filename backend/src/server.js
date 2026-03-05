const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const config = require('./config');
const { connectDB, initSystemConfig } = require('./services/dbInitService');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const { maintenanceGuard } = require('./middlewares/maintenance');
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const listRoutes = require('./routes/listRoutes');
const adminRoutes = require('./routes/adminRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const User = require('./models/User');
const { startReminderJob } = require('./jobs/reminderJob');
const { startSelfDestructJob } = require('./jobs/selfDestructJob');

const app = express();

// Security headers
app.use(helmet());

// CORS — in production behind Nginx, allow same-origin; in dev, allow Vite dev server
app.use(
  cors({
    origin: process.env.NODE_ENV === 'production' ? true : config.clientUrl,
    credentials: true,
  })
);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Health check — before maintenance guard so monitoring always works
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Maintenance mode guard (before routes, after body parsers)
app.use(maintenanceGuard);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);

// System status: is the system claimed (has any admin)?
app.get('/api/system-status', async (_req, res) => {
  try {
    const userCount = await User.countDocuments();
    res.json({ success: true, claimed: userCount > 0 });
  } catch {
    res.json({ success: true, claimed: true }); // fail-safe
  }
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

// ── Preflight: validate critical environment variables ──
const preflight = () => {
  const required = ['MONGO_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.error(`FATAL: Missing required environment variables: ${missing.join(', ')}`);
    console.error('The server cannot start without these. Check your .env or Docker environment.');
    process.exit(1);
  }
  if (process.env.JWT_ACCESS_SECRET === 'change_me_jwt_secret' || process.env.JWT_REFRESH_SECRET === 'change_me_refresh_secret') {
    console.warn('WARNING: Using default JWT secrets. Change them in production!');
  }
};

// Start server
const start = async () => {
  preflight();
  await connectDB();
  await initSystemConfig();

  // Check if system is claimed
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║       SYSTEM UNCLAIMED                       ║');
    console.log('╠══════════════════════════════════════════════╣');
    console.log('║  The first user to register will become      ║');
    console.log('║  the admin. Navigate to /register to claim.  ║');
    console.log('╚══════════════════════════════════════════════╝');
  } else {
    console.log(`System claimed — ${userCount} user(s) registered.`);
  }

  // Start cron jobs
  startReminderJob();
  startSelfDestructJob();

  const port = config.port;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
};

start();

module.exports = app;
