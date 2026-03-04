import api from './axios';

// ──── Auth ────

export const registerUser = (data) => api.post('/auth/register', data);
export const loginUser = (data) => api.post('/auth/login', data);
export const verifyOtp = (data) => api.post('/auth/verify-otp', data);
export const verifyEmail = (token) => api.get(`/auth/verify-email?token=${token}`);
export const refreshToken = () => api.post('/auth/refresh');
export const logoutUser = () => api.post('/auth/logout');
export const getMe = () => api.get('/auth/me');
export const changePassword = (data) => api.put('/auth/change-password', data);
export const changeEmail = (data) => api.put('/auth/change-email', data);
export const updatePreferences = (data) => api.put('/auth/preferences', data);

// ──── System ────

export const getSystemStatus = () => api.get('/system-status');

// ──── TOTP / 2FA ────

export const setupTotp = () => api.post('/auth/totp/setup');
export const verifyTotpSetup = (data) => api.post('/auth/totp/verify-setup', data);
export const disableTotp = (data) => api.post('/auth/totp/disable', data);

// ──── Lists ────

export const fetchLists = () => api.get('/lists');
export const createList = (data) => api.post('/lists', data);
export const updateList = (id, data) => api.put(`/lists/${id}`, data);
export const deleteList = (id) => api.delete(`/lists/${id}`);

// ──── Tasks ────

/**
 * @param {{ listId?: string, completed?: boolean }} params
 */
export const fetchTasks = (params = {}) => {
  const query = new URLSearchParams();
  if (params.listId) query.set('listId', params.listId);
  if (params.completed !== undefined) query.set('completed', String(params.completed));
  const qs = query.toString();
  return api.get(qs ? `/tasks?${qs}` : '/tasks');
};

export const fetchTask = (id) => api.get(`/tasks/${id}`);

export const createTask = (data) => {
  if (data instanceof FormData) {
    return api.post('/tasks', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }
  return api.post('/tasks', data);
};

export const updateTask = (id, data) => {
  if (data instanceof FormData) {
    return api.put(`/tasks/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }
  return api.put(`/tasks/${id}`, data);
};

export const deleteTask = (id) => api.delete(`/tasks/${id}`);

export const syncTasks = (tasks) => api.post('/tasks/sync', { tasks });
export const fetchUserTags = () => api.get('/tasks/tags');
export const toggleSubtask = (taskId, subtaskId) => api.put(`/tasks/${taskId}/subtasks/${subtaskId}/toggle`);

// ──── Admin ────

export const fetchAdminStats = () => api.get('/admin/stats');
export const fetchAdminUsers = (params = {}) => {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page);
  if (params.limit) query.set('limit', params.limit);
  if (params.search) query.set('search', params.search);
  const qs = query.toString();
  return api.get(qs ? `/admin/users?${qs}` : '/admin/users');
};
export const fetchAdminUser = (id) => api.get(`/admin/users/${id}`);
export const toggleUserActive = (id) => api.put(`/admin/users/${id}/toggle-active`);
export const changeUserRole = (id, role) => api.put(`/admin/users/${id}/role`, { role });
export const forcePasswordReset = (id) => api.post(`/admin/users/${id}/force-password-reset`);
export const verifyUserAdmin = (id) => api.post(`/admin/users/${id}/verify`);
export const disable2FAAdmin = (id) => api.post(`/admin/users/${id}/disable-2fa`);
export const deleteUserAdmin = (id) => api.delete(`/admin/users/${id}`);
export const fetchSystemConfig = () => api.get('/admin/config');
export const updateSystemConfig = (data) => api.put('/admin/config', data);
export const sendTestEmail = (to) => api.post('/admin/config/test-email', { to });
export const impersonateUser = (userId) => api.post(`/admin/impersonate/${userId}`);
export const stopImpersonation = () => api.post('/admin/stop-impersonation');
export const fetchAuditLogs = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v) query.set(k, v); });
  const qs = query.toString();
  return api.get(qs ? `/admin/audit-logs?${qs}` : '/admin/audit-logs');
};
export const exportData = (type) => api.get(`/admin/export/${type}`);
export const cleanupCompleted = (days) => api.delete(`/admin/cleanup/completed?days=${days}`);

// ──── Settings ────

export const fetchPublicConfig = () => api.get('/settings/public');
