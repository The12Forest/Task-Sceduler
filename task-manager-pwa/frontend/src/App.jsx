import { useState, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ListProvider } from './context/ListContext';
import { TaskProvider } from './context/TaskContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import CompletedTasksPage from './pages/CompletedTasksPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';

/** Provides the sidebar open callback to child pages */
const SidebarContext = createContext(() => {});
export const useSidebarOpen = () => useContext(SidebarContext);

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
        <Navbar />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          {/* Protected routes share providers via AuthenticatedLayout */}
          <Route element={<AuthenticatedLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/completed" element={<CompletedTasksPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
