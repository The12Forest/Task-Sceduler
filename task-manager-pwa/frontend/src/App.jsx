import { useState, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ListProvider } from './context/ListContext';
import { TaskProvider } from './context/TaskContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ImpersonationBanner from './components/ImpersonationBanner';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import DashboardPage from './pages/DashboardPage';
import CompletedTasksPage from './pages/CompletedTasksPage';
import SettingsPage from './pages/SettingsPage';
import WelcomePage from './pages/WelcomePage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminAuditLogPage from './pages/AdminAuditLogPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';

/** Provides the sidebar open callback to child pages */
const SidebarContext = createContext(() => {});
export const useSidebarOpen = () => useContext(SidebarContext);

/**
 * Root route redirector: shows WelcomePage if not authenticated,
 * redirects to /dashboard if logged in.
 */
const RootRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <WelcomePage />;
};

/**
 * Layout wrapper shared by all authenticated pages.
 * Wraps with ListProvider + TaskProvider so state persists across navigation.
 */
const AuthenticatedLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ProtectedRoute>
      <ListProvider>
        <TaskProvider>
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="md:pl-64 min-h-[calc(100vh-64px)]">
            <SidebarContext.Provider value={() => setSidebarOpen(true)}>
              <Outlet />
            </SidebarContext.Provider>
          </main>
        </TaskProvider>
      </ListProvider>
    </ProtectedRoute>
  );
};

/**
 * Layout for admin pages: sidebar + admin route guard.
 */
const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AdminRoute>
      <ListProvider>
        <TaskProvider>
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="md:pl-64 min-h-[calc(100vh-64px)]">
            <SidebarContext.Provider value={() => setSidebarOpen(true)}>
              <Outlet />
            </SidebarContext.Provider>
          </main>
        </TaskProvider>
      </ListProvider>
    </AdminRoute>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1a2e',
              color: '#e0e0e0',
              border: '1px solid #2a2a4a',
            },
          }}
        />
        <ImpersonationBanner />
        <Navbar />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<RootRoute />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          {/* Protected routes share providers via AuthenticatedLayout */}
          <Route element={<AuthenticatedLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/completed" element={<CompletedTasksPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Admin routes */}
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/settings" element={<AdminSettingsPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/audit" element={<AdminAuditLogPage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
