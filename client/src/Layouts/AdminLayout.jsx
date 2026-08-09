import React, { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { FaBoxOpen, FaChartLine, FaComments, FaLayerGroup, FaShoppingBag, FaStarHalfAlt, FaTruck, FaUsers, FaWarehouse, FaRobot, FaTrophy, FaInbox, FaBullhorn } from 'react-icons/fa';
import { useAuth } from '../Context/Authcontext';

const AdminLayout = () => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
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
        <div className="mb-6 flex items-center gap-3 px-3">
          <div className="btn-elegant rounded-lg p-2 text-white"><FaShoppingBag /></div>
          <div>
            <p className="font-serif text-base font-bold text-primary">Sunita's Collection</p>
            <p className="text-xs text-ink-light">Store management</p>
          </div>
        </div>
        <nav className="flex gap-2 overflow-x-auto lg:flex-col">
          {[
            { to: '/admin', label: 'Overview', icon: FaChartLine, end: true },
            { to: '/admin/products', label: 'Products', icon: FaBoxOpen },
            { to: '/admin/inventory', label: 'Inventory', icon: FaWarehouse },
{ to: '/admin/categories', label: 'Categories', icon: FaLayerGroup },
            { to: '/admin/orders', label: 'Orders', icon: FaTruck },
{ to: '/admin/messages', label: 'Messages', icon: FaComments },
{ to: '/admin/conversations', label: 'Inbox', icon: FaInbox },
            { to: '/admin/chatbot', label: 'Chatbot Training', icon: FaRobot },
            { to: '/admin/gamification', label: 'Gamification', icon: FaTrophy },
{ to: '/admin/users', label: 'Customers', icon: FaUsers },
            { to: '/admin/reports', label: 'Reports', icon: FaChartLine },
{ to: '/admin/reviews', label: 'Reviews', icon: FaStarHalfAlt },
            { to: '/admin/marketing', label: 'Marketing', icon: FaBullhorn },
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
      </aside>
      <main className="min-w-0">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
