import React, { useEffect } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { FaBoxOpen, FaChartLine, FaComments, FaLayerGroup, FaTruck, FaUsers, FaWarehouse, FaInbox, FaBullhorn, FaUserCircle, FaSignOutAlt, FaMapMarkerAlt } from 'react-icons/fa';
import { useAuth } from '../Context/Authcontext';
import NotificationCenter from '../components/chat/NotificationCenter';
import logo from '../assets/LOGO!.png';

const AdminLayout = () => {
  const { isAuthenticated, isAdmin, loading, logout, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        navigate('/login');
      } else if (!isAdmin) {
        navigate('/');
      }
    }
  }, [isAuthenticated, isAdmin, loading, navigate]);

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
    <div className="min-h-screen bg-cream-light lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="border-b border-gold/20 bg-cream px-4 py-5 lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="mb-6 flex items-center justify-between gap-3 px-3">
          <div className="flex items-center gap-3">
            <Link to="/">
              <img src={logo} alt="Sunita'z Collection" className="h-16 w-auto object-contain" />
            </Link>
            <p className="font-serif text-base font-bold text-primary">Store management</p>
          </div>
          <NotificationCenter />
        </div>
        {user?.name && (
          <div className="mb-4 rounded-xl border border-gold/20 bg-white/60 px-3 py-2.5 text-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-ink-light">Logged in as</p>
            <p className="mt-0.5 truncate font-semibold text-primary">{user.name}</p>
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
              navigate('/login');
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
