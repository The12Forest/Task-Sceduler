import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getMe,
  logoutUser,
  loginUser,
  verifyOtp,
  registerUser,
  verifyEmail as verifyEmailAPI,
  updatePreferences as updatePrefsAPI,
  impersonateUser as impersonateAPI,
  stopImpersonation as stopImpersonateAPI,
} from '../api/endpoints';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check auth on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      getMe()
        .then((res) => setUser(res.data.user))
        .catch(() => {
          localStorage.removeItem('accessToken');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (data) => {
    const res = await registerUser(data);
    return res.data;
  }, []);

  const login = useCallback(async (data) => {
    const res = await loginUser(data);
    return res.data;
  }, []);

  const verifyOtpCode = useCallback(async (data) => {
    const res = await verifyOtp(data);
    localStorage.setItem('accessToken', res.data.accessToken);
    setUser(res.data.user);
    return res.data;
  }, []);

  const verifyEmail = useCallback(async (token) => {
    const res = await verifyEmailAPI(token);
    return res.data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch {
      // ignore
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('adminToken');
    setUser(null);
  }, []);

  const updatePreferences = useCallback(async (prefs) => {
    const res = await updatePrefsAPI(prefs);
    setUser((prev) => prev ? { ...prev, preferences: res.data.preferences } : prev);
    return res.data;
  }, []);

  const impersonate = useCallback(async (userId) => {
    // Save current admin token
    const currentToken = localStorage.getItem('accessToken');
    localStorage.setItem('adminToken', currentToken);

    const res = await impersonateAPI(userId);
    localStorage.setItem('accessToken', res.data.accessToken);
    setUser(res.data.user);
    return res.data;
  }, []);

  const stopImpersonation = useCallback(async () => {
    // Try API first
    try {
      const res = await stopImpersonateAPI();
      localStorage.setItem('accessToken', res.data.accessToken);
      localStorage.removeItem('adminToken');
      setUser(res.data.user);
      return res.data;
    } catch {
      // Fallback: restore saved admin token
      const adminToken = localStorage.getItem('adminToken');
      if (adminToken) {
        localStorage.setItem('accessToken', adminToken);
        localStorage.removeItem('adminToken');
        const meRes = await getMe();
        setUser(meRes.data.user);
      }
    }
  }, []);

  const isAdmin = user?.role === 'admin';
  const isImpersonating = !!user?.impersonatedBy;

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin,
    isImpersonating,
    register,
    login,
    verifyOtpCode,
    verifyEmail,
    logout,
    updatePreferences,
    impersonate,
    stopImpersonation,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
