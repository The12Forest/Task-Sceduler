import api from './axios';

// ──── Auth ────

export const registerUser = (data) => api.post('/auth/register', data);
export const loginUser = (data) => api.post('/auth/login', data);
export const verifyOtp = (data) => api.post('/auth/verify-otp', data);
export const verifyEmail = (token) => api.get(`/auth/verify-email?token=${token}`);
export const refreshToken = () => api.post('/auth/refresh');
export const logoutUser = () => api.post('/auth/logout');
export const getMe = () => api.get('/auth/me');

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
