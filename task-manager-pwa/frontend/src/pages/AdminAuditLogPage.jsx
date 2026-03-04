import { useState, useEffect, useCallback } from 'react';
import { fetchAuditLogs } from '../api/endpoints';
import { useSidebarOpen } from '../App';
import toast from 'react-hot-toast';

const categories = ['all', 'auth', 'config', 'user', 'impersonation', 'smtp', 'system', 'data'];

const categoryColors = {
  auth: 'text-blue-400 bg-blue-500/10',
  config: 'text-yellow-400 bg-yellow-500/10',
  user: 'text-green-400 bg-green-500/10',
  impersonation: 'text-purple-400 bg-purple-500/10',
  smtp: 'text-cyan-400 bg-cyan-500/10',
  system: 'text-red-400 bg-red-500/10',
  data: 'text-orange-400 bg-orange-500/10',
};

const AdminAuditLogPage = () => {
  const openSidebar = useSidebarOpen();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const limit = 30;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (category !== 'all') params.category = category;
      const res = await fetchAuditLogs(params);
      setLogs(res.data.logs);
      setTotal(res.data.total);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [page, category]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={openSidebar}
          className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-dark-surface rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white">Audit Log</h1>
          <p className="text-gray-400 mt-1">{total} entries</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => { setCategory(c); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
              category === c
                ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30'
                : 'text-gray-400 hover:text-white hover:bg-dark-surface border border-transparent'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Logs */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <p className="text-gray-500 text-center py-12">No audit logs found</p>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div
              key={log._id}
              className="bg-dark-card border border-dark-border rounded-xl overflow-hidden hover:border-dark-border/80 transition-colors"
            >
              <button
                onClick={() => setExpanded(expanded === log._id ? null : log._id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
              >
                {/* Category badge */}
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryColors[log.category] || 'text-gray-400 bg-gray-500/10'}`}>
                  {log.category}
                </span>

                {/* Action */}
                <span className="text-white text-sm font-medium flex-1 truncate">{log.action}</span>

                {/* Admin name */}
                <span className="text-gray-500 text-xs hidden sm:inline">
                  {log.adminId?.name || 'System'}
                </span>

                {/* Timestamp */}
                <span className="text-gray-600 text-xs flex-shrink-0">
                  {new Date(log.createdAt).toLocaleString()}
                </span>

                {/* Expand icon */}
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform ${expanded === log._id ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Expanded details */}
              {expanded === log._id && (
                <div className="px-4 pb-4 pt-0 border-t border-dark-border/50 space-y-2 text-xs">
                  {log.adminId && (
                    <div className="flex gap-2">
                      <span className="text-gray-500 w-24">Admin:</span>
                      <span className="text-gray-300">{log.adminId.name} ({log.adminId.email})</span>
                    </div>
                  )}
                  {log.affectedUserId && (
                    <div className="flex gap-2">
                      <span className="text-gray-500 w-24">Affected User:</span>
                      <span className="text-gray-300">{log.affectedUserId.name || log.affectedUserId}</span>
                    </div>
                  )}
                  {log.ipAddress && (
                    <div className="flex gap-2">
                      <span className="text-gray-500 w-24">IP:</span>
                      <span className="text-gray-300">{log.ipAddress}</span>
                    </div>
                  )}
                  {log.details && (
                    <div className="flex gap-2">
                      <span className="text-gray-500 w-24">Details:</span>
                      <span className="text-gray-300">{log.details}</span>
                    </div>
                  )}
                  {log.oldValue !== undefined && log.oldValue !== null && (
                    <div className="flex gap-2">
                      <span className="text-gray-500 w-24">Old Value:</span>
                      <span className="text-red-400 font-mono">{JSON.stringify(log.oldValue)}</span>
                    </div>
                  )}
                  {log.newValue !== undefined && log.newValue !== null && (
                    <div className="flex gap-2">
                      <span className="text-gray-500 w-24">New Value:</span>
                      <span className="text-green-400 font-mono">{JSON.stringify(log.newValue)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm rounded-lg bg-dark-surface text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            Previous
          </button>
          <span className="text-gray-500 text-sm">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm rounded-lg bg-dark-surface text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminAuditLogPage;
