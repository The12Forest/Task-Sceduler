import { useState, useEffect, useCallback } from 'react';
import {
  fetchAdminUsers,
  toggleUserActive,
  changeUserRole,
  forcePasswordReset,
  deleteUserAdmin,
  impersonateUser,
} from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { useSidebarOpen } from '../App';
import toast from 'react-hot-toast';

const roleBadge = {
  admin: 'bg-red-500/20 text-red-400 border-red-500/30',
  moderator: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  user: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

const AdminUsersPage = () => {
  const openSidebar = useSidebarOpen();
  const { impersonate } = useAuth();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // userId being acted on
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAdminUsers({ page, limit, search });
      setUsers(res.data.users);
      setTotal(res.data.total);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const act = async (fn, userId, ...args) => {
    setActionLoading(userId);
    try {
      await fn(userId, ...args);
      toast.success('Action completed');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleActive = (u) => act(toggleUserActive, u._id);
  const handleForceReset = (u) => act(forcePasswordReset, u._id);
  const handleDelete = (u) => {
    if (!confirm(`Delete user "${u.name}" and all their data? This cannot be undone.`)) return;
    act(deleteUserAdmin, u._id);
  };
  const handleRoleChange = (u, role) => act(changeUserRole, u._id, role);
  const handleImpersonate = async (u) => {
    try {
      const res = await impersonateUser(u._id);
      impersonate(res.data.token, res.data.user);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to impersonate');
    }
  };

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
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <p className="text-gray-400 mt-1">{total} total users</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name or email…"
          className="w-full md:w-80 bg-dark-surface border border-dark-border rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <p className="text-gray-500 text-center py-12">No users found</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-dark-border text-gray-400">
                <th className="py-3 px-2">User</th>
                <th className="py-3 px-2">Role</th>
                <th className="py-3 px-2 hidden md:table-cell">Tasks</th>
                <th className="py-3 px-2 hidden md:table-cell">Status</th>
                <th className="py-3 px-2 hidden lg:table-cell">Last Login</th>
                <th className="py-3 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const disabled = actionLoading === u._id;
                return (
                  <tr key={u._id} className="border-b border-dark-border/50 hover:bg-dark-surface/40 transition-colors">
                    {/* User info */}
                    <td className="py-3 px-2">
                      <div>
                        <p className="text-white font-medium">{u.name}</p>
                        <p className="text-gray-500 text-xs">{u.email}</p>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3 px-2">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u, e.target.value)}
                        disabled={disabled}
                        className={`text-xs font-medium px-2 py-1 rounded-md border bg-transparent cursor-pointer ${roleBadge[u.role]} disabled:opacity-50`}
                      >
                        <option value="user">user</option>
                        <option value="moderator">moderator</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>

                    {/* Tasks */}
                    <td className="py-3 px-2 text-gray-400 hidden md:table-cell">{u.taskCount ?? '—'}</td>

                    {/* Status */}
                    <td className="py-3 px-2 hidden md:table-cell">
                      {u.isActive ? (
                        <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">Active</span>
                      ) : (
                        <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">Disabled</span>
                      )}
                      {u.isVerified === false && (
                        <span className="text-xs text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full ml-1">Unverified</span>
                      )}
                    </td>

                    {/* Last Login */}
                    <td className="py-3 px-2 text-gray-500 text-xs hidden lg:table-cell">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-2">
                      <div className="flex items-center justify-end gap-1">
                        {/* Toggle Active */}
                        <button
                          onClick={() => handleToggleActive(u)}
                          disabled={disabled}
                          title={u.isActive ? 'Disable user' : 'Enable user'}
                          className="p-1.5 rounded-lg hover:bg-dark-surface text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                        >
                          {u.isActive ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          )}
                        </button>

                        {/* Force Password Reset */}
                        <button
                          onClick={() => handleForceReset(u)}
                          disabled={disabled}
                          title="Force password reset"
                          className="p-1.5 rounded-lg hover:bg-dark-surface text-gray-400 hover:text-yellow-400 transition-colors disabled:opacity-50"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                        </button>

                        {/* Impersonate */}
                        <button
                          onClick={() => handleImpersonate(u)}
                          disabled={disabled}
                          title="Impersonate user"
                          className="p-1.5 rounded-lg hover:bg-dark-surface text-gray-400 hover:text-primary-400 transition-colors disabled:opacity-50"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(u)}
                          disabled={disabled}
                          title="Delete user"
                          className="p-1.5 rounded-lg hover:bg-dark-surface text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
          <span className="text-gray-500 text-sm">
            Page {page} of {totalPages}
          </span>
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

export default AdminUsersPage;
