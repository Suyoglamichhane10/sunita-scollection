import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaUser, FaSignOutAlt, FaBars, FaTimes, FaSearch, FaShoppingCart } from 'react-icons/fa';
import { useAuth } from '../../Context/Authcontext';
import { useCart } from '../../Context/CartContext';
import NotificationCenter from '../chat/NotificationCenter';
import Avatar from './Avatar';
import logo from '../../assets/LOGO!.png';

const Navbar = () => {
  const { isAuthenticated, isAdmin, logout, user } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const publicLinks = [
    { label: 'Home', to: '/' },
    { label: 'Shop', to: '/shop' },
    { label: 'About Us', to: '/about' },
    { label: 'Contact', to: '/contact' },
  ];

  const customerLinks = [
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Orders', to: '/orders' },
    { label: 'Messages', to: '/messages' },
    { label: 'Profile', to: '/profile' },
  ];

  const links = [...publicLinks];
  if (isAuthenticated) {
    links.push(...(isAdmin
      ? customerLinks.filter((l) => l.label === 'Profile')
      : customerLinks));
  }
  if (isAdmin) links.push({ label: 'Admin Panel', to: '/admin' });

  const isActive = (to) => location.pathname === to;

  return (
    <nav className="sticky top-0 z-40 border-b border-gold/20 bg-cream/95 shadow-sm backdrop-blur">
      <div className="mx-auto px-4 py-3 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          {/* Brand - left side, original position */}
          <Link to="/" className="flex items-center">
            <img 
              src={logo} 
              alt="Sunita'z Collection" 
              className="h-14 w-auto object-contain"
            />
          </Link>

          {/* Desktop links - center */}
          <div className="hidden items-center gap-5 lg:flex">
            {links.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className={`text-sm font-medium transition ${
                  isActive(link.to)
                    ? 'text-primary font-semibold'
                    : 'text-ink-light hover:text-primary'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side: Icons + Auth + Hamburger */}
          <div className="flex items-center gap-2.5">
            {/* Desktop icons */}
            <div className="hidden items-center gap-1.5 lg:flex">
              <button
                type="button"
                onClick={() => navigate('/shop')}
                className="rounded-full border border-gold/40 p-2.5 text-ink-light transition hover:border-primary hover:text-primary"
                aria-label="Search products"
              >
                <FaSearch />
              </button>

              {isAuthenticated && <NotificationCenter />}

              <Link
                to="/cart"
                className="relative rounded-full border border-gold/40 p-2.5 text-ink-light transition hover:border-primary hover:text-primary"
                aria-label="Shopping cart"
              >
                <FaShoppingCart />
                {totalItems > 0 && (
                  <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-dark px-1.5 text-[11px] font-bold text-white shadow">
                    {totalItems}
                  </span>
                )}
              </Link>
            </div>

            {/* Mobile icons - cart and notification on right side */}
            <div className="flex items-center gap-1.5 lg:hidden">
              <button
                type="button"
                onClick={() => navigate('/shop')}
                className="rounded-full border border-gold/40 p-2.5 text-ink-light transition hover:border-primary hover:text-primary"
                aria-label="Search products"
              >
                <FaSearch />
              </button>

              {isAuthenticated && <NotificationCenter />}
              <Link
                to="/cart"
                className="relative rounded-full border border-gold/40 p-2.5 text-ink-light transition hover:border-primary hover:text-primary"
                aria-label="Shopping cart"
              >
                <FaShoppingCart />
                {totalItems > 0 && (
                  <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-dark px-1.5 text-[11px] font-bold text-white shadow">
                    {totalItems}
                  </span>
                )}
              </Link>
            </div>

            {/* Hamburger menu - right side, after icons */}
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="rounded-full border border-gold/40 p-2.5 text-primary lg:hidden"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <FaTimes /> : <FaBars />}
            </button>

            {/* Auth buttons - desktop only */}
            <div className="hidden lg:flex lg:items-center lg:gap-2">
              {isAuthenticated ? (
                <>
                  <Link to="/profile" title="My Profile">
                    <Avatar src={user?.avatar} name={user?.name} size="sm" showBorder={true} borderColor="border-primary hover:border-primary/80" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      navigate('/');
                    }}
                    className="btn-elegant flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark"
                  >
                    <FaSignOutAlt />
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="btn-elegant flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark"
                >
                  <FaUser />
                  Login
                </Link>
              )}
            </div>
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
                    ? 'bg-primary/10 text-primary'
                    : 'text-ink-light hover:bg-primary/5'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <>
                <div className="mt-2 flex items-center gap-3 rounded-xl bg-primary/5 px-4 py-3">
                  <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-primary">
                    <Avatar src={user?.avatar} name={user?.name} size="sm" showBorder={false} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-primary">{user?.name || 'User'}</p>
                    <p className="truncate text-xs text-ink-light">{user?.email || ''}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    navigate('/');
                    setMobileOpen(false);
                  }}
                  className="btn-elegant mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
                >
                  <FaSignOutAlt /> Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="btn-elegant mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
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
