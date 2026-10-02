import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaUser, FaSignOutAlt, FaBars, FaTimes, FaSearch, FaShoppingCart } from 'react-icons/fa';
import { useAuth } from '../../Context/Authcontext';
import { useCart } from '../../Context/CartContext';
import NotificationBell from './NotificationBell';
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

  const customerLinks = [{ label: 'Dashboard', to: '/dashboard' }];

  const links = [...publicLinks];
  if (isAuthenticated) {
    links.push(...customerLinks);
  }
  if (isAdmin) links.push({ label: 'Admin Panel', to: '/admin' });

  const isActive = (to) => location.pathname === to;

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <nav className="sticky top-0 z-40 border-b border-gold/20 bg-cream/95 shadow-sm backdrop-blur">
      <div className="container-custom px-4 py-3 lg:px-8">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <Link to="/" className="flex min-w-0 shrink items-center">
            <img
              src={logo}
              alt="Sunita'z Collection"
              className="h-11 w-auto object-contain sm:h-14 lg:h-16"
            />
          </Link>

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

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <button
                type="button"
                onClick={() => navigate('/shop')}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gold/40 text-ink-light transition hover:border-primary hover:text-primary sm:h-11 sm:w-11"
                aria-label="Search products"
              >
                <FaSearch />
              </button>

              {isAuthenticated && !isAdmin && <NotificationBell />}

              <Link
                to="/cart"
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-gold/40 text-ink-light transition hover:border-primary hover:text-primary sm:h-11 sm:w-11"
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

            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gold/40 text-primary sm:h-11 sm:w-11 lg:hidden"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <FaTimes /> : <FaBars />}
            </button>

            <div className="hidden lg:flex lg:items-center lg:gap-2">
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" title="My Dashboard">
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

        {mobileOpen &&
          createPortal(
            <div className="fixed inset-0 z-[100] lg:hidden">
              <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setMobileOpen(false)}
                aria-hidden="true"
              />
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Main menu"
                className="absolute inset-x-0 bottom-0 top-0 flex flex-col overflow-hidden bg-cream sm:inset-y-0 sm:left-auto sm:right-0 sm:top-0 sm:w-[380px] sm:border-l sm:border-gold/20 sm:shadow-luxury"
              >
                <div className="flex items-center justify-between border-b border-gold/20 px-4 py-3">
                  <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center">
                    <img src={logo} alt="Sunita'z Collection" className="h-11 w-auto object-contain" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/40 text-primary"
                    aria-label="Close menu"
                  >
                    <FaTimes />
                  </button>
                </div>

                <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-4">
                  <ul className="space-y-1">
                    {links.map((link) => (
                      <li key={link.label}>
                        <Link
                          to={link.to}
                          onClick={() => setMobileOpen(false)}
                          className={`flex min-h-[48px] items-center rounded-xl px-4 py-3 text-[15px] font-medium transition ${
                            isActive(link.to)
                              ? 'bg-primary/10 text-primary'
                              : 'text-ink-light hover:bg-primary/5'
                          }`}
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>

                  {isAuthenticated ? (
                    <div className="mt-4 border-t border-gold/20 pt-4">
                      <div className="flex items-center gap-3 rounded-xl bg-primary/5 px-4 py-3">
                        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-primary">
                          <Avatar src={user?.avatar} name={user?.name} size="sm" showBorder={false} />
                        </div>
                        <div className="min-w-0 flex-1">
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
                        className="btn-elegant mt-3 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-dark"
                      >
                        <FaSignOutAlt /> Logout
                      </button>
                    </div>
                  ) : (
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="btn-elegant mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-dark"
                    >
                      <FaUser /> Login
                    </Link>
                  )}
                </nav>
              </div>
            </div>,
            document.body
          )}
      </div>
    </nav>
  );
};

export default Navbar;
