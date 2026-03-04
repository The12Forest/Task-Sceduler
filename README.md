# Task Scheduler

A full-stack task management Progressive Web App (PWA) with offline support, admin dashboard, two-factor authentication, and Docker deployment.

Built with **React**, **Express.js**, **MongoDB**, and **Tailwind CSS**.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Screenshots](#screenshots)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [Docker (Recommended)](#docker-recommended)
  - [Docker with Existing MongoDB](#docker-with-existing-mongodb)
  - [Manual Setup](#manual-setup)
- [Environment Variables](#environment-variables)
- [Usage](#usage)
  - [First-Time Setup](#first-time-setup)
  - [Creating Tasks](#creating-tasks)
  - [Offline Mode](#offline-mode)
  - [Admin Panel](#admin-panel)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [PWA & Offline Support](#pwa--offline-support)
- [Security](#security)
- [Background Jobs](#background-jobs)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### Task Management
- Create, edit, and delete tasks with priority levels (Low / Medium / High)
- Organize tasks into custom lists with a default list per user
- Add subtasks with individual completion tracking
- Tag tasks with hashtags for filtering and search
- Attach files to tasks (PDF, images, documents, spreadsheets, and more)
- Self-destruct tasks — auto-delete 60 seconds after completion
- Email reminders for upcoming due dates
- View and manage completed tasks separately

### Authentication & Security
- Email-based registration with OTP verification
- Two-factor authentication via TOTP (Google Authenticator)
- Brute-force protection with account lockout
- JWT access tokens + refresh tokens for session management
- Role-based access control (User, Moderator, Admin)
- Configurable password policies (length, uppercase, numbers, special characters)
- Admin impersonation with full audit trail

### Progressive Web App
- Installable on mobile and desktop
- Offline task creation with automatic sync when back online
- Service Worker caching (cache-first for assets, network-first for API)
- Push notification support
- Offline fallback page

### Admin Dashboard
- System statistics with user and task charts
- Full user management (activate/deactivate, role changes, force password reset)
- System-wide configuration panel
- SMTP email settings with test email
- Audit logging of all admin actions (retained 365 days)
- Data export (users/tasks)
- Bulk cleanup of old completed tasks
- Maintenance mode (blocks non-admin users)

### System Configuration
- App branding (name, logo, favicon, footer text)
- Toggle public registration, email verification, and 2FA requirements
- Configurable rate limits, upload sizes, and allowed file types
- Task and list limits per user
- Email reminder scheduling
- Quiet hours for notifications
- Security headers (CSP, Helmet, HSTS)

---

## Tech Stack

| Layer       | Technology                                                       |
| ----------- | ---------------------------------------------------------------- |
| Frontend    | React 18, Vite, Tailwind CSS, React Router 6, Axios             |
| Backend     | Node.js, Express.js, Mongoose, JWT, Nodemailer                  |
| Database    | MongoDB 7                                                        |
| Auth        | bcryptjs, JSON Web Tokens, Speakeasy (TOTP), QRCode             |
| Validation  | Joi                                                              |
| Jobs        | node-cron                                                        |
| File Upload | Multer                                                           |
| Security    | Helmet, CORS, express-rate-limit                                 |
| PWA         | Service Worker, IndexedDB (idb), Web Push                       |
| DevOps      | Docker, Docker Compose, Nginx                                    |

---

## Screenshots

> *Add screenshots of your application here.*

---

## Prerequisites

- **Docker** and **Docker Compose** (recommended), or:
- **Node.js** 20+
- **MongoDB** 7+
- **npm** or **yarn**

---

## Installation

### Docker (Recommended)

The fastest way to get started. This sets up the app, MongoDB, and Nginx in a single command.

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/task-scheduler.git
   cd task-scheduler
   ```

2. **Configure environment variables**

   Edit the `environment` section in `docker-compose.yml` or create a `.env` file:

   ```env
   NODE_ENV=production
   PORT=5000
   MONGO_URI=mongodb://mongo:27017/taskmanager
   JWT_ACCESS_SECRET=your-access-secret-here
   JWT_REFRESH_SECRET=your-refresh-secret-here
   ADMIN_EMAIL=your-admin@email.com
   CLIENT_URL=http://localhost
   SMTP_HOST=smtp.example.com
   SMTP_PORT=587
   SMTP_USER=your-email@example.com
   SMTP_PASS=your-email-password
   SMTP_FROM=noreply@taskmanager.app
   ```

3. **Start the application**

   ```bash
   docker compose up -d
   ```

4. **Access the app** at [http://localhost](http://localhost)

### Docker with Existing MongoDB

If you already have a MongoDB instance running:

1. **Edit** `docker-compose.existing.yml` and set your `MONGO_URI`:

   ```yaml
   environment:
     MONGO_URI: mongodb://your-mongo-host:27017/taskmanager
   ```

2. **Start the application**

   ```bash
   docker compose -f docker-compose.existing.yml up -d
   ```

### Manual Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/task-scheduler.git
   cd task-scheduler
   ```

2. **Install backend dependencies**

   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**

   ```bash
   cd ../frontend
   npm install
   ```

4. **Configure environment variables**

   Create a `.env` file in the `backend/` directory:

   ```env
   NODE_ENV=development
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/taskmanager
   JWT_ACCESS_SECRET=your-access-secret-here
   JWT_REFRESH_SECRET=your-refresh-secret-here
   ADMIN_EMAIL=your-admin@email.com
   CLIENT_URL=http://localhost:5173
   SMTP_HOST=smtp.example.com
   SMTP_PORT=587
   SMTP_USER=your-email@example.com
   SMTP_PASS=your-email-password
   SMTP_FROM=noreply@taskmanager.app
   ```

5. **Start MongoDB**

   Make sure MongoDB is running on your machine, or use a cloud-hosted instance.

6. **Start the backend** (from the `backend/` directory)

   ```bash
   npm run dev
   ```

7. **Start the frontend** (from the `frontend/` directory)

   ```bash
   npm run dev
   ```

8. **Access the app** at [http://localhost:5173](http://localhost:5173)

---

## Environment Variables

| Variable             | Required | Default                        | Description                          |
| -------------------- | -------- | ------------------------------ | ------------------------------------ |
| `NODE_ENV`           | No       | `development`                  | Environment mode                     |
| `PORT`               | No       | `5000`                         | Backend server port                  |
| `MONGO_URI`          | **Yes**  | —                              | MongoDB connection string            |
| `JWT_ACCESS_SECRET`  | **Yes**  | —                              | Secret key for access tokens         |
| `JWT_REFRESH_SECRET` | **Yes**  | —                              | Secret key for refresh tokens        |
| `ADMIN_EMAIL`        | No       | —                              | Email of the first admin user        |
| `CLIENT_URL`         | No       | `http://localhost:5173`        | Frontend URL (used for CORS)         |
| `SMTP_HOST`          | No       | —                              | SMTP server hostname                 |
| `SMTP_PORT`          | No       | —                              | SMTP server port                     |
| `SMTP_USER`          | No       | —                              | SMTP username                        |
| `SMTP_PASS`          | No       | —                              | SMTP password                        |
| `SMTP_FROM`          | No       | `noreply@taskmanager.app`      | Sender address for outgoing emails   |

> **Tip:** Generate strong secrets for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` using `openssl rand -hex 64` or a similar tool.

---

## Usage

### First-Time Setup

1. Navigate to the app and click **Register**.
2. The **first user** to register automatically becomes the **admin**. Subsequent users receive the regular user role.
3. Check your email for the OTP verification code and complete login.
4. If TOTP is enabled, scan the QR code with Google Authenticator or a compatible app.

### Creating Tasks

- Click **+ New Task** on the dashboard.
- Set a name, description, priority, due date, and optional tags.
- Add subtasks for multi-step work.
- Attach a file if needed.
- Enable **Self-Destruct** to auto-delete the task 60 seconds after completion.

### Offline Mode

- Tasks created while offline are stored in IndexedDB.
- When the connection is restored, tasks automatically sync to the server.
- The offline fallback page shows connectivity status and a retry button.

### Admin Panel

Access the admin panel from the sidebar (admin users only):

- **Dashboard** — View user/task statistics and charts.
- **Users** — Manage users, toggle active status, change roles, force password resets.
- **Settings** — Configure app-wide settings including SMTP, authentication policies, branding, and more.
- **Audit Logs** — Review a full history of admin actions.

---

## API Reference

### Authentication — `/api/auth`

| Method | Endpoint            | Auth | Description                         |
| ------ | ------------------- | ---- | ----------------------------------- |
| POST   | `/register`         | No   | Register a new user                 |
| GET    | `/verify-email`     | No   | Verify email via token              |
| POST   | `/login`            | No   | Log in (sends OTP)                  |
| POST   | `/verify-otp`       | No   | Verify OTP to complete login        |
| POST   | `/refresh`          | No   | Refresh access token                |
| POST   | `/logout`           | Yes  | Log out (revoke refresh token)      |
| GET    | `/me`               | Yes  | Get current user profile            |
| PUT    | `/change-password`  | Yes  | Change password                     |
| PUT    | `/change-email`     | Yes  | Change email address                |
| PUT    | `/preferences`      | Yes  | Update user preferences             |
| POST   | `/totp/setup`       | Yes  | Generate TOTP setup QR code         |
| POST   | `/totp/verify-setup`| Yes  | Verify and enable TOTP 2FA          |
| POST   | `/totp/disable`     | Yes  | Disable TOTP 2FA                    |

### Tasks — `/api/tasks`

| Method | Endpoint                          | Auth | Description                     |
| ------ | --------------------------------- | ---- | ------------------------------- |
| GET    | `/`                               | Yes  | List tasks (filter by list, tag, status) |
| GET    | `/:id`                            | Yes  | Get a single task               |
| POST   | `/`                               | Yes  | Create a task (supports file upload) |
| PUT    | `/:id`                            | Yes  | Update a task                   |
| DELETE | `/:id`                            | Yes  | Delete a task                   |
| GET    | `/tags`                           | Yes  | Get all unique tags for user    |
| PUT    | `/:id/subtasks/:subtaskId/toggle` | Yes  | Toggle subtask completion       |
| POST   | `/sync`                           | Yes  | Batch sync offline tasks        |

### Lists — `/api/lists`

| Method | Endpoint | Auth | Description        |
| ------ | -------- | ---- | ------------------ |
| GET    | `/`      | Yes  | Get user's lists   |
| POST   | `/`      | Yes  | Create a new list  |
| PUT    | `/:id`   | Yes  | Update a list      |
| DELETE | `/:id`   | Yes  | Delete a list      |

### Admin — `/api/admin` *(Admin only)*

| Method | Endpoint                         | Description                        |
| ------ | -------------------------------- | ---------------------------------- |
| GET    | `/stats`                         | Dashboard statistics               |
| GET    | `/users`                         | List users (paginated, searchable) |
| GET    | `/users/:id`                     | Get user details                   |
| PUT    | `/users/:id/toggle-active`       | Toggle user active status          |
| PUT    | `/users/:id/role`                | Change user role                   |
| POST   | `/users/:id/force-password-reset`| Force password reset               |
| POST   | `/users/:id/verify`              | Manually verify user email         |
| POST   | `/users/:id/disable-2fa`         | Disable user's 2FA                 |
| DELETE | `/users/:id`                     | Delete user and their data         |
| GET    | `/config`                        | Get system configuration           |
| PUT    | `/config`                        | Update system configuration        |
| POST   | `/config/test-email`             | Send a test email                  |
| POST   | `/impersonate/:userId`           | Start impersonating a user         |
| POST   | `/stop-impersonation`            | Stop impersonation                 |
| GET    | `/audit-logs`                    | View audit logs (filtered)         |
| GET    | `/export/:type`                  | Export data (users/tasks)          |
| DELETE | `/cleanup/completed`             | Delete old completed tasks         |

### System

| Method | Endpoint              | Auth | Description                           |
| ------ | --------------------- | ---- | ------------------------------------- |
| GET    | `/api/health`         | No   | Health check                          |
| GET    | `/api/system-status`  | No   | Check if system has been claimed      |
| GET    | `/api/settings/public`| No   | Public configuration (branding, etc.) |

---

## Project Structure

```
├── docker-compose.yml            # Docker setup with MongoDB
├── docker-compose.existing.yml   # Docker setup for external MongoDB
├── Dockerfile                    # Multi-stage build (frontend + backend + nginx)
├── nginx.conf                    # Nginx reverse proxy config
├── LICENSE                       # Apache 2.0 License
│
├── backend/
│   ├── package.json
│   ├── uploads/                  # Uploaded file storage
│   └── src/
│       ├── server.js             # Express app entry point
│       ├── config/
│       │   ├── db.js             # MongoDB connection
│       │   └── index.js          # Environment variable config
│       ├── controllers/
│       │   ├── adminController.js
│       │   ├── authController.js
│       │   ├── listController.js
│       │   └── taskController.js
│       ├── jobs/
│       │   ├── reminderJob.js    # Email reminders (every 15 min)
│       │   └── selfDestructJob.js# Auto-delete tasks (every 15 sec)
│       ├── middlewares/
│       │   ├── auth.js           # JWT authentication & authorization
│       │   ├── errorHandler.js   # Centralized error handling
│       │   ├── maintenance.js    # Maintenance mode gate
│       │   ├── rateLimiter.js    # Rate limiting (login, OTP, API, admin)
│       │   ├── upload.js         # File upload (Multer)
│       │   └── validation.js     # Request validation (Joi)
│       ├── models/
│       │   ├── AuditLog.js       # Admin action audit trail
│       │   ├── SystemConfig.js   # App-wide configuration (singleton)
│       │   ├── Task.js           # Task with subtasks, tags, files
│       │   ├── TodoList.js       # Task list grouping
│       │   └── User.js           # User with auth, 2FA, preferences
│       ├── routes/
│       │   ├── adminRoutes.js
│       │   ├── authRoutes.js
│       │   ├── listRoutes.js
│       │   ├── settingsRoutes.js
│       │   └── taskRoutes.js
│       ├── services/
│       │   ├── emailService.js   # Nodemailer email sending
│       │   └── tokenService.js   # JWT token generation
│       └── utils/
│           ├── asyncHandler.js   # Async error wrapper
│           ├── otp.js            # OTP generation
│           └── totp.js           # TOTP (Google Authenticator)
│
└── frontend/
    ├── package.json
    ├── vite.config.js            # Vite build config with API proxy
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    ├── public/
    │   ├── manifest.json         # PWA manifest
    │   ├── sw.js                 # Service Worker
    │   ├── offline.html          # Offline fallback page
    │   └── icons/                # PWA icons
    └── src/
        ├── App.jsx               # Routes & layout
        ├── main.jsx              # Entry point + SW registration
        ├── index.css             # Tailwind imports
        ├── api/
        │   ├── axios.js          # Axios instance with interceptors
        │   └── endpoints.js      # API endpoint constants
        ├── components/
        │   ├── AdminRoute.jsx    # Admin-only route guard
        │   ├── ImpersonationBanner.jsx
        │   ├── Navbar.jsx
        │   ├── ProtectedRoute.jsx
        │   ├── Sidebar.jsx
        │   ├── StatsCards.jsx
        │   ├── StatusIndicator.jsx
        │   ├── TaskCard.jsx
        │   └── TaskModal.jsx
        ├── context/
        │   ├── AuthContext.jsx   # Auth state & token management
        │   ├── ListContext.jsx   # List state
        │   └── TaskContext.jsx   # Task state & CRUD
        ├── hooks/
        │   └── useOnlineStatus.js
        ├── pages/
        │   ├── AdminAuditLogPage.jsx
        │   ├── AdminDashboardPage.jsx
        │   ├── AdminSettingsPage.jsx
        │   ├── AdminUsersPage.jsx
        │   ├── CompletedTasksPage.jsx
        │   ├── DashboardPage.jsx
        │   ├── LoginPage.jsx
        │   ├── RegisterPage.jsx
        │   ├── SettingsPage.jsx
        │   ├── VerifyEmailPage.jsx
        │   └── WelcomePage.jsx
        └── services/
            ├── indexedDB.js      # Offline task storage
            ├── notificationService.js
            └── syncService.js    # Offline-to-online sync
```

---

## PWA & Offline Support

Task Scheduler is a fully installable Progressive Web App:

- **Install**: Click the browser's install prompt or use "Add to Home Screen" on mobile.
- **Offline task creation**: Tasks created without connectivity are saved to IndexedDB and synced automatically when back online.
- **Caching strategy**:
  - Static assets use **cache-first** for fast loading.
  - API calls use **network-first** with cached fallback.
- **Push notifications**: Receive reminders and updates even when the app isn't in the foreground.
- **Background sync**: The `sync-tasks` event ensures queued tasks are pushed to the server when connectivity returns.

---

## Security

- **Helmet** — Sets secure HTTP headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, etc.).
- **Rate limiting** — Login: 10 attempts / 15 min. OTP: 5 attempts / 5 min. API: configurable per-minute limit.
- **Brute-force protection** — Accounts lock after repeated failed login attempts.
- **JWT** — Short-lived access tokens (15 min) with long-lived refresh tokens (7 days). Multiple sessions supported.
- **Password hashing** — bcrypt with salt rounds.
- **TOTP 2FA** — Google Authenticator compatible two-factor authentication.
- **CORS** — Configurable allowed origins.
- **Input validation** — All inputs validated with Joi schemas.
- **File upload restrictions** — Allowed file types and size limits enforced.
- **Audit logging** — All admin actions recorded with IP address, timestamps, and change details.
- **Maintenance mode** — Block all non-admin traffic during updates.

---

## Background Jobs

| Job              | Schedule       | Description                                                        |
| ---------------- | -------------- | ------------------------------------------------------------------ |
| Task Reminders   | Every 15 min   | Sends email reminders for tasks due within the configured offset   |
| Self-Destruct    | Every 15 sec   | Deletes completed tasks that have passed their self-destruct timer |

Both jobs respect the system configuration and can be toggled from the admin settings panel.

---

## Configuration

After the first admin registers, most settings can be managed from **Admin → Settings** in the web UI:

| Category         | Examples                                                              |
| ---------------- | --------------------------------------------------------------------- |
| **Branding**     | App name, logo URL, favicon URL, support email, footer text           |
| **Server**       | Base URL, port, force HTTPS, CORS, log level, rate limits, upload size|
| **SMTP**         | Host, port, user, password, encryption, sender name/email             |
| **Auth**         | Public registration, require 2FA, email verification, password policy |
| **Tasks**        | Default priority, file uploads, max tasks/lists per user, reminders   |
| **Notifications**| Browser notifications, daily summary, quiet hours                     |
| **Impersonation**| Enable/disable, max duration, admin restrictions                      |
| **Security**     | CSP, Helmet, CSRF, secure cookies                                     |
| **Maintenance**  | Toggle maintenance mode, custom message                               |

---

## Contributing

Contributions are welcome! To get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m "Add your feature"`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

Please make sure your code follows the existing conventions and includes appropriate tests where applicable.

---

## License

This project is licensed under the **Apache License 2.0** — see the [LICENSE](LICENSE) file for details.
