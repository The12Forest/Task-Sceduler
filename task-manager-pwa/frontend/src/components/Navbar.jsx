import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StatusIndicator from './StatusIndicator';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-dark-card border-b border-dark-border sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <svg className="w-8 h-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <span className="text-xl font-bold text-white">TaskManager</span>
        </Link>

        <div className="flex items-center gap-4">
          <StatusIndicator />
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400 hidden sm:inline">
                {user?.name}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm bg-dark-surface text-gray-300 rounded-lg hover:bg-red-600/20 hover:text-red-400 transition-all duration-200 border border-dark-border"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
