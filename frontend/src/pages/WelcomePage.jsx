import { Link } from 'react-router-dom';

const features = [
  {
    title: 'Smart Task Prioritization',
    desc: 'Overdue tasks automatically rise to the top with intelligent sorting logic and visual urgency indicators.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  {
    title: 'Multiple Todo Lists',
    desc: 'Organize projects separately with independent task groups. Unlimited lists, each with their own focus.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    title: 'Offline First',
    desc: 'Create tasks without internet. All changes sync automatically in the background when connectivity returns.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    title: 'Admin Dashboard',
    desc: 'System statistics, user management, and impersonation mode. Full control over your deployment.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

const uiPreviews = [
  { title: 'Dashboard', desc: 'Organize and prioritize your tasks at a glance', gradient: 'from-primary-600/20 to-primary-900/20' },
  { title: 'Completed Tasks', desc: 'Track your progress with a dedicated completed view', gradient: 'from-green-600/20 to-green-900/20' },
  { title: 'Sidebar Lists', desc: 'Switch between projects with one-click navigation', gradient: 'from-blue-600/20 to-blue-900/20' },
  { title: 'Dark Mode', desc: 'Beautiful dark interface designed for focused work', gradient: 'from-purple-600/20 to-purple-900/20' },
];

const WelcomePage = () => {
  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-transparent to-primary-600/10" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary-600/5 rounded-full blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-4 pt-16 sm:pt-20 pb-16 sm:pb-24 text-center min-h-[80dvh] flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 bg-primary-600/10 border border-primary-600/20 rounded-full">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm text-primary-300">Open Source &middot; Self-hosted &middot; Privacy-focused</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Task<span className="text-primary-400">Manager</span>
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            A modern, offline-capable, secure task management platform built for individuals and teams.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              to="/register"
              className="px-8 py-3.5 bg-primary-600 text-white rounded-xl text-lg font-semibold hover:bg-primary-700 transition-all duration-300 hover:shadow-lg hover:shadow-primary-600/25 w-full sm:w-auto"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="px-8 py-3.5 bg-dark-card border border-dark-border text-gray-300 rounded-xl text-lg font-semibold hover:bg-dark-surface hover:text-white transition-all duration-300 w-full sm:w-auto"
            >
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* What It Is */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">What It Is</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            A Progressive Web App that works offline, features secure authentication with JWT + 2FA,
            supports multiple todo lists, and includes real-time urgency tracking with overdue detection.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
          {['Progressive Web App', 'Works Offline', 'JWT + 2FA Auth', 'Multiple Lists', 'Overdue Tracking'].map((item) => (
            <div
              key={item}
              className="bg-dark-card border border-dark-border rounded-xl p-4 text-center hover:border-primary-600/40 transition-colors"
            >
              <div className="w-3 h-3 bg-primary-500 rounded-full mx-auto mb-3" />
              <span className="text-sm font-medium text-gray-300">{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="bg-dark-card/50 border-y border-dark-border">
        <div className="max-w-5xl mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Feature Highlights</h2>
            <p className="text-gray-400 text-lg">Everything you need for productive task management</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-dark-card border border-dark-border rounded-2xl p-8 hover:border-primary-600/40 transition-all duration-300 group"
              >
                <div className="w-14 h-14 bg-primary-600/10 border border-primary-600/20 rounded-xl flex items-center justify-center text-primary-400 mb-5 group-hover:bg-primary-600/20 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* UI Preview Section */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Beautiful Interface</h2>
          <p className="text-gray-400 text-lg">Designed for focus and productivity</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {uiPreviews.map((preview) => (
            <div
              key={preview.title}
              className={`bg-gradient-to-br ${preview.gradient} border border-dark-border rounded-2xl p-8 h-48 flex flex-col justify-end`}
            >
              <h3 className="text-lg font-bold text-white mb-1">{preview.title}</h3>
              <p className="text-sm text-gray-400">{preview.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Open Source Section */}
      <section className="border-t border-dark-border">
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 bg-primary-600/10 border border-primary-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Open Source</h2>
          <p className="text-xl text-gray-400 mb-2">
            Fully open-source. No tracking. No lock-in.
          </p>
          <p className="text-gray-500 mb-8">
            Deploy on your own infrastructure. Modify as you wish.
          </p>

          <a
            href="https://github.com/The12Forest/Task-Sceduler"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-dark-card border border-dark-border text-gray-300 rounded-xl font-semibold hover:bg-dark-surface hover:text-white transition-all duration-300"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            View on GitHub
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-border py-8">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span className="text-sm text-gray-500">TaskManager &mdash; Open Source Task Management</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link to="/login" className="hover:text-gray-300 transition-colors">Login</Link>
            <Link to="/register" className="hover:text-gray-300 transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WelcomePage;
