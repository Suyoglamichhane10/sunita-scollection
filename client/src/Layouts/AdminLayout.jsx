import React, { useEffect } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { FaBoxOpen, FaChartLine, FaComments, FaLayerGroup, FaTruck, FaUsers, FaWarehouse, FaInbox, FaBullhorn, FaUserCircle, FaSignOutAlt, FaMapMarkerAlt, FaImages } from 'react-icons/fa';
import { useAuth } from '../Context/Authcontext';
import NotificationCenter from '../components/chat/NotificationCenter';
import Avatar from '../components/common/Avatar';
import logo from '../assets/LOGO!.png';

const AdminLayout = () => {
  const { isAuthenticated, isAdmin, loading, logout, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated || !isAdmin) {
        navigate('/login', { replace: true });
      }
    }
  }, [isAuthenticated, isAdmin, loading, navigate]);

  useEffect(() => {
    return () => {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('chat_history');
      } catch {
        // ignore cleanup errors
      }
    };
  }, []);

  if (loading || !isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 py-20">
        <div className="container-custom px-4 lg:px-8">
          <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            {loading ? 'Loading admin panel...' : 'Redirecting...'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-light lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="border-b border-gold/20 bg-cream px-5 py-6 lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="mb-6 flex flex-col items-center gap-3">
          <Link to="/" className="block">
            <img src="/admin-logo.png" alt="Sunita'z Collection" className="h-20 w-20 rounded-full object-contain bg-white shadow-md ring-2 ring-gold/30" />
          </Link>
          <div className="flex w-full items-center justify-between">
            <p className="text-center font-serif text-base font-bold text-primary">Store management</p>
            <NotificationCenter />
          </div>
        </div>
        {user?.name && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-gold/20 bg-white/60 px-3 py-2.5 text-sm">
            <Avatar src={user?.avatar} name={user?.name} size="sm" showBorder={true} borderColor="border-white" />
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-ink-light">Logged in as</p>
              <p className="truncate font-semibold text-primary">{user.name}</p>
            </div>
          </div>
        )}
<nav className="flex gap-2 overflow-x-auto lg:flex-col lg:flex-1">
          {[
             { to: '/admin', label: 'Overview', icon: FaChartLine, end: true },
             { to: '/admin/products', label: 'Products', icon: FaBoxOpen },
             { to: '/admin/inventory', label: 'Inventory', icon: FaWarehouse },
             { to: '/admin/categories', label: 'Categories', icon: FaLayerGroup },
             { to: '/admin/orders', label: 'Orders', icon: FaTruck },
             { to: '/admin/delivery', label: 'Delivery Tracking', icon: FaMapMarkerAlt },
             { to: '/admin/slideshow', label: 'Slideshow', icon: FaImages },
             { to: '/admin/messages', label: 'Messages', icon: FaComments },
             { to: '/admin/conversations', label: 'Inbox', icon: FaInbox },
             { to: '/admin/users', label: 'Customers', icon: FaUsers },
             { to: '/admin/reports', label: 'Reports', icon: FaChartLine },
             { to: '/admin/marketing', label: 'Marketing', icon: FaBullhorn },
             { to: '/admin/profile', label: 'My Profile', icon: FaUserCircle },
           ].map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-blush text-primary' : 'text-ink-light hover:bg-gold/20 hover:text-primary'}`}
            >
              <Icon className="text-base" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout button */}
        <div className="mt-auto border-t border-gold/20 pt-4 lg:mt-0">
          <button
            type="button"
            onClick={() => {
              logout();
              setTimeout(() => window.location.href = '/login', 50);
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <FaSignOutAlt className="text-base" />
            Logout
          </button>
        </div>
      </aside>
      <main className="min-w-0">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
