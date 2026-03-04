import { useState, useEffect } from 'react';
import { fetchAdminStats } from '../api/endpoints';
import { useSidebarOpen } from '../App';
import toast from 'react-hot-toast';

const StatCard = ({ label, value, color, icon }) => (
  <div className={`bg-dark-card border border-dark-border rounded-xl p-5 hover:border-${color}-600/40 transition-colors`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-400">{label}</p>
        <p className={`text-3xl font-bold mt-1 text-${color}-400`}>{value}</p>
      </div>
      <div className={`text-${color}-400 opacity-50`}>{icon}</div>
    </div>
  </div>
);

const AdminDashboardPage = () => {
  const openSidebar = useSidebarOpen();
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchAdminStats();
        setStats(res.data.stats);
        setCharts(res.data.charts);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load admin stats');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={openSidebar}
          className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-dark-surface rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-400 mt-1">System overview and statistics</p>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Users" value={stats.totalUsers} color="primary" icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          } />
          <StatCard label="Active Users" value={stats.activeUsers} color="green" icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          } />
          <StatCard label="Total Tasks" value={stats.totalTasks} color="blue" icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          } />
          <StatCard label="Completed" value={stats.completedTasks} color="green" icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          } />
          <StatCard label="Overdue" value={stats.overdueTasks} color="red" icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          } />
          <StatCard label="Created Today" value={stats.tasksCreatedToday} color="yellow" icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          } />
          <StatCard label="Completed Today" value={stats.tasksCompletedToday} color="green" icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          } />
          <StatCard label="Total Lists" value={stats.totalLists} color="purple" icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          } />
        </div>
      )}

      {/* Charts */}
      {charts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tasks Per Day (last 30 days) */}
          <div className="bg-dark-card border border-dark-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Tasks Created (Last 30 Days)</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {charts.tasksPerDay.length === 0 ? (
                <p className="text-gray-500 text-sm">No data</p>
              ) : (
                charts.tasksPerDay.map((d) => {
                  const maxVal = Math.max(...charts.tasksPerDay.map((x) => x.count), 1);
                  const pct = (d.count / maxVal) * 100;
                  return (
                    <div key={d._id} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-20 flex-shrink-0">{d._id}</span>
                      <div className="flex-1 bg-dark-surface rounded-full h-5 overflow-hidden">
                        <div
                          className="bg-primary-600 h-full rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-8 text-right">{d.count}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Registrations Per Week */}
          <div className="bg-dark-card border border-dark-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">User Registrations (Last 12 Weeks)</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {charts.registrationsPerWeek.length === 0 ? (
                <p className="text-gray-500 text-sm">No data</p>
              ) : (
                charts.registrationsPerWeek.map((d) => {
                  const maxVal = Math.max(...charts.registrationsPerWeek.map((x) => x.count), 1);
                  const pct = (d.count / maxVal) * 100;
                  return (
                    <div key={d._id} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-20 flex-shrink-0">{d._id}</span>
                      <div className="flex-1 bg-dark-surface rounded-full h-5 overflow-hidden">
                        <div
                          className="bg-green-600 h-full rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-8 text-right">{d.count}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
