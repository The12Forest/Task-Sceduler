import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe, logoutUser, loginUser, verifyOtp, registerUser, verifyEmail as verifyEmailAPI } from '../api/endpoints';

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
    setUser(null);
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    register,
    login,
    verifyOtpCode,
    verifyEmail,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
