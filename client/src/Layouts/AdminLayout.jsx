import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { FaBoxOpen, FaChartLine, FaComments, FaLayerGroup, FaTruck, FaUsers, FaWarehouse, FaInbox, FaBullhorn, FaUserCircle, FaSignOutAlt, FaMapMarkerAlt, FaImages, FaBars, FaTimes } from 'react-icons/fa';
import { useAuth } from '../Context/Authcontext';
import NotificationCenter from '../components/chat/NotificationCenter';
import Avatar from '../components/common/Avatar';

const AdminLayout = () => {
  const { isAuthenticated, isAdmin, loading, logout, user } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

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

  const navItems = [
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
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex flex-col items-center gap-3 flex-shrink-0">
        <div className="block">
          <img
            src="/admin-logo.png"
            alt="Sunita'z Collection"
            className="h-20 w-20 rounded-full object-contain bg-white shadow-md ring-2 ring-gold/30"
          />
        </div>
        <p className="font-serif text-base font-bold text-primary">Store management</p>
      </div>
      {user?.name && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-gold/20 bg-white/60 px-3 py-2.5 text-sm flex-shrink-0">
          <Avatar src={user?.avatar} name={user?.name} size="sm" showBorder={true} borderColor="border-white" />
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-ink-light">Logged in as</p>
            <p className="truncate font-semibold text-primary">{user.name}</p>
          </div>
        </div>
      )}
      <nav className="flex-1 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    isActive ? 'bg-blush text-primary' : 'text-ink-light hover:bg-gold/20 hover:text-primary'
                  }`
                }
              >
                <Icon className="text-base" />
                {label}
              </NavLink>
            </li>
          ))}
          <li>
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
          </li>
        </ul>
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream-light lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar drawer on mobile, static sidebar on desktop */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-40 w-80 transform bg-cream shadow-xl transition-transform duration-300 ease-in-out lg:static lg:z-auto lg:translate-x-0 lg:w-[280px] lg:shadow-none',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {/* Close button on mobile */}
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="absolute right-3 top-3 rounded-full border border-gold/40 p-2 text-primary lg:hidden"
          aria-label="Close sidebar"
        >
          <FaTimes />
        </button>

        {sidebarContent}
      </aside>

      {/* Main content area */}
      <div className="min-w-0 flex flex-col">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gold/20 bg-cream px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-full border border-gold/40 p-2.5 text-primary"
            aria-label="Open sidebar"
          >
            <FaBars />
          </button>
          <p className="font-serif text-base font-bold text-primary">Store management</p>
          <NotificationCenter />
        </header>

        <main className="flex-1 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
