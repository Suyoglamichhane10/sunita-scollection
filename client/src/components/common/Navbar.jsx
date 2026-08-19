import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaUser, FaSearch, FaShoppingCart, FaSignOutAlt, FaBars, FaTimes, FaHeart } from 'react-icons/fa';
import { useAuth } from '../../Context/Authcontext';
import { useCart } from '../../Context/CartContext';
import wishlistApi from '../../Services/wishlistApi';
import NotificationCenter from '../chat/NotificationCenter';
import Avatar from './Avatar';
import logo from '../../assets/LOGO!.png';

const Navbar = () => {
  const { isAuthenticated, isAdmin, logout, user } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);

  const publicLinks = [
    { label: 'Home', to: '/' },
    { label: 'Shop', to: '/shop' },
    { label: 'About Us', to: '/about' },
    { label: 'Contact', to: '/contact' },
  ];

  const customerLinks = [
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Orders', to: '/orders' },
    { label: 'Wishlist', to: '/wishlist' },
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

  useEffect(() => {
    if (!isAuthenticated || isAdmin) return;
    let active = true;
    const loadWishlistCount = async () => {
      try {
        const { data } = await wishlistApi.getWishlist();
        if (active) setWishlistCount((data.wishlist?.items || []).length);
      } catch {}
    };
    loadWishlistCount();
    return () => { active = false; };
  }, [isAuthenticated, isAdmin]);

  return (
    <nav className="sticky top-0 z-40 border-b border-gold/20 bg-cream/95 shadow-sm backdrop-blur">
      <div className="mx-auto px-4 py-3 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          {/* Brand */}
          <Link to="/" className="flex items-center">
            <img 
              src={logo} 
              alt="Sunita'z Collection" 
              className="h-14 w-auto object-contain"
            />
          </Link>

          {/* Desktop links */}
          <div className="hidden items-center gap-5 lg:flex">
            {links.map((link) => (
              <Link
                key={link.label}
                to={link.to}
className={`text-sm font-medium transition ${
                  isActive(link.to)
                    ? 'text-red-600'
                    : 'text-ink-light hover:text-red-600'
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
              className="rounded-full border border-red-300 p-2.5 text-ink-light transition hover:border-red-500 hover:text-red-600"
              aria-label="Search products"
            >
              <FaSearch />
            </button>

            {isAuthenticated && <NotificationCenter />}

            <Link
              to="/cart"
              className="relative rounded-full border border-red-300 p-2.5 text-ink-light transition hover:border-red-500 hover:text-red-600"
              aria-label="Shopping cart"
            >
              <FaShoppingCart />
              {totalItems > 0 && (
                <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 px-1.5 text-[11px] font-bold text-white shadow">
                  {totalItems}
                </span>
              )}
            </Link>

            <Link
              to="/wishlist"
              className="relative rounded-full border border-red-300 p-2.5 text-ink-light transition hover:border-red-500 hover:text-red-600"
              aria-label="Wishlist"
            >
              <FaHeart />
              {wishlistCount > 0 && (
                <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 px-1.5 text-[11px] font-bold text-white shadow">
                  {wishlistCount}
                </span>
              )}
            </Link>

             {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link to="/profile" title="My Profile">
                  <Avatar src={user?.avatar} name={user?.name} size="sm" showBorder={true} borderColor="border-red-400 hover:border-red-600" />
                </Link>
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
              </div>
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
              className="rounded-full border border-red-300 p-2.5 text-red-600 lg:hidden"
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
                    ? 'bg-red-50 text-red-600'
                    : 'text-ink-light hover:bg-red-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
{isAuthenticated ? (
              <>
                <div className="mt-2 flex items-center gap-3 rounded-xl bg-primary-50 px-4 py-3">
                  <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-red-400">
                    <Avatar src={user?.avatar} name={user?.name} size="sm" showBorder={false} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-primary-800">{user?.name || 'User'}</p>
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
                  className="btn-elegant mt-2 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
                >
                  <FaSignOutAlt /> Logout
                </button>
              </>
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
