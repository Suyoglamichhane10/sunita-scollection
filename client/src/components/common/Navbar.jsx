import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaShoppingBag, FaUser, FaSearch, FaShoppingCart, FaSignOutAlt, FaHeart, FaGem, FaBars, FaTimes } from 'react-icons/fa';
import { useAuth } from '../../Context/Authcontext';
import { useCart } from '../../Context/CartContext';
import NotificationCenter from '../chat/NotificationCenter';

const Navbar = () => {
  const { isAuthenticated, isAdmin, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const publicLinks = [
    { label: 'Home', to: '/' },
    { label: 'Shop', to: '/shop' },
  ];

  const customerLinks = [
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Rewards', to: '/rewards' },
    { label: 'Wishlist', to: '/wishlist' },
    { label: 'Orders', to: '/orders' },
    { label: 'Community', to: '/social' },
    { label: 'Messages', to: '/messages' },
  ];

  const links = [...publicLinks];
  if (isAuthenticated) links.push(...customerLinks);
  if (isAdmin) links.push({ label: 'Admin Panel', to: '/admin' });

  const isActive = (to) => location.pathname === to;

  return (
    <nav className="sticky top-0 z-40 border-b border-gold/20 bg-cream/95 shadow-sm backdrop-blur">
      <div className="mx-auto px-4 py-3 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3">
            <div className="rounded-full bg-gradient-to-br from-primary-600 to-primary-400 p-2.5 text-white shadow-luxury">
              <FaGem size={16} />
            </div>
            <div>
              <p className="font-serif text-lg font-bold text-primary-800">
                Sunita's <span className="text-gold-gradient">Collection</span>
              </p>
              <p className="text-xs tracking-wide text-ink-light">Women's fashion & accessories</p>
            </div>
          </Link>

          {/* Desktop links */}
          <div className="hidden items-center gap-5 lg:flex">
            {links.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className={`text-sm font-medium transition ${
                  isActive(link.to)
                    ? 'text-gold-600'
                    : 'text-ink-light hover:text-primary-600'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Icons */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate('/shop')}
              className="rounded-full border border-gold/40 p-2.5 text-ink-light transition hover:border-gold-500 hover:text-gold-600"
              aria-label="Search products"
            >
              <FaSearch />
            </button>

            {isAuthenticated && <NotificationCenter />}

            <Link
              to="/cart"
              className="relative rounded-full border border-gold/40 p-2.5 text-ink-light transition hover:border-gold-500 hover:text-gold-600"
              aria-label="Shopping cart"
            >
              <FaShoppingCart />
              {totalItems > 0 && (
                <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gradient-to-br from-gold-500 to-gold-600 px-1.5 text-[11px] font-bold text-white shadow">
                  {totalItems}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="btn-elegant hidden items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold sm:flex"
              >
                <FaSignOutAlt />
                Logout
              </button>
            ) : (
              <Link
                to="/login"
                className="btn-elegant hidden items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold sm:flex"
              >
                <FaUser />
                Login
              </Link>
            )}

            {/* Mobile toggle */}
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="rounded-full border border-gold/40 p-2.5 text-primary-700 lg:hidden"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="mt-3 space-y-1 rounded-2xl border border-gold/20 bg-white p-3 shadow-elegant lg:hidden">
            {links.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`block rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  isActive(link.to)
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-ink-light hover:bg-cream'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/');
                  setMobileOpen(false);
                }}
                className="btn-elegant mt-2 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
              >
                <FaSignOutAlt /> Logout
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="btn-elegant mt-2 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
              >
                <FaUser /> Login
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
