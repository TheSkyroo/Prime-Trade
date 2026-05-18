import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="text-lg font-bold text-blue-400">
              PrimeTrade
            </Link>
            <div className="flex gap-1">
              <NavLink to="/dashboard" active={isActive('/dashboard')}>
                Dashboard
              </NavLink>
              <NavLink to="/tasks" active={isActive('/tasks')}>
                Tasks
              </NavLink>
              {user?.role === 'ADMIN' && (
                <NavLink to="/admin" active={isActive('/admin')}>
                  Admin
                </NavLink>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-sm hidden sm:block">{user?.email}</span>
            <span className={user?.role === 'ADMIN' ? 'badge-admin' : 'badge-user'}>
              {user?.role}
            </span>
            <button onClick={handleLogout} className="btn-ghost text-sm px-3 py-1.5">
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavLink({
  to,
  active,
  children,
}: {
  to: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        active
          ? 'bg-slate-800 text-white'
          : 'text-slate-400 hover:text-white hover:bg-slate-800'
      }`}
    >
      {children}
    </Link>
  );
}
