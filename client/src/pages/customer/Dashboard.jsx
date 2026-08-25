import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaBoxOpen, FaTruck, FaCheckCircle, FaTimesCircle,
  FaShoppingBag, FaClipboardList, FaUser, FaArrowRight,
  FaHeart, FaStar, FaClock,
} from 'react-icons/fa';
import api from '../../Services/api';
import { useAuth } from '../../Context/Authcontext';
import { useCart } from '../../Context/CartContext';
import Avatar from '../../components/common/Avatar';
import wishlistApi from '../../Services/wishlistApi';

const ContinuousTypewriter = ({ words = [], speed = 100, deleteSpeed = 60, pause = 1500, className = '' }) => {
  const [wordIndex, setWordIndex] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[wordIndex];

    if (!isDeleting && displayed === currentWord) {
      const timeout = setTimeout(() => setIsDeleting(true), pause);
      return () => clearTimeout(timeout);
    }

    if (isDeleting && displayed === '') {
      setIsDeleting(false);
      setWordIndex((prev) => (prev + 1) % words.length);
      return;
    }

    const timeout = setTimeout(
      () => {
        if (isDeleting) {
          setDisplayed((prev) => prev.slice(0, -1));
        } else {
          setDisplayed((prev) => prev + currentWord[prev.length]);
        }
      },
      isDeleting ? deleteSpeed : speed
    );

    return () => clearTimeout(timeout);
  }, [displayed, isDeleting, wordIndex, words, speed, deleteSpeed, pause]);

  return (
    <span className={className}>
      {displayed}
      <span className="ml-0.5 inline-block h-5 w-1 animate-pulse bg-primary-800 align-middle" />
    </span>
  );
};

const STATUS_BADGE = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-indigo-100 text-indigo-700',
  packed: 'bg-purple-100 text-purple-700',
  shipped: 'bg-cyan-100 text-cyan-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
};

const money = (n) => `Rs. ${Number(n || 0).toLocaleString()}`;

const Dashboard = () => {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [dash, setDash] = useState(null);
  const [orders, setOrders] = useState([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    let active = true;

    const loadDashboard = async () => {
      try {
        const { data } = await api.get('/dashboard');
        if (active) {
          setDash(data.dashboard || {});
          setOrders((data.dashboard?.orderSummary?.recentOrders) || []);
          try {
            const w = await wishlistApi.getWishlist();
            if (active) setWishlistCount((w.wishlist?.items || []).length);
          } catch {}
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Dashboard API failed, falling back to profile/orders:', error);
      }

      try {
        const [profileRes, ordersRes, wishlistRes] = await Promise.all([
          api.get('/users/profile').catch(() => null),
          api.get('/orders/my-orders').catch(() => null),
          wishlistApi.getWishlist().catch(() => null),
        ]);
        if (active) {
          const profileUser = profileRes?.data?.user || null;
          const myOrders = ordersRes?.data?.orders || [];
          setDash({
            user: profileUser
              ? { name: profileUser.name, avatar: profileUser.avatar, email: profileUser.email }
              : { name: user?.name || 'there' },
          });
          setOrders(myOrders);
          setWishlistCount((wishlistRes?.data?.wishlist?.items || []).length);
        }
      } catch (error) {
        console.error('Fallback dashboard load failed:', error);
        if (active) setDash({ user: { name: user?.name || 'there' } });
      } finally {
        if (active) setLoading(false);
      }
    };

    loadDashboard();

    const timeout = setTimeout(() => {
      if (active) setLoading(false);
    }, 6000);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [authLoading, isAuthenticated, navigate, user?.name]);

  const d = dash || {};
  const profile = d.user || { name: user?.name || 'there' };
  const firstName = String(profile?.name || user?.name || 'there').split(' ')[0];

  const orderSummary = {
    totalOrders: orders.length,
    active: orders.filter((o) => ['pending', 'confirmed', 'processing', 'packed', 'shipped'].includes(o.orderStatus)).length,
    delivered: orders.filter((o) => o.orderStatus === 'delivered').length,
    cancelled: orders.filter((o) => o.orderStatus === 'cancelled').length,
  };

  const totalSpent = orders
    .filter((o) => o.paymentStatus !== 'failed')
    .reduce((acc, o) => acc + Number(o.totalAmount || 0), 0);
  const avgOrderValue = orders.length ? totalSpent / orders.length : 0;

  const reorder = async (order) => {
    try {
      for (const item of order.items || []) {
        await addToCart(
          {
            _id: item.product,
            name: item.name,
            price: item.price,
            image: item.image,
            stock: 999,
            variants: item.variantSku ? [{ sku: item.variantSku }] : [],
          },
          item.quantity,
          item.variantSku ? { sku: item.variantSku } : null
        );
      }
      navigate('/cart');
    } catch (error) {
      console.error('Reorder failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream py-10">
        <div className="container-custom px-4 lg:px-8">
          <div className="h-48 animate-pulse rounded-3xl bg-gradient-to-br from-primary-200 to-primary-100" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-3xl bg-white/60" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const quickActions = [
    { id: 'shop', label: 'Shop Now', to: '/shop', icon: FaShoppingBag, color: 'from-primary-500 to-primary-700', iconBg: 'bg-primary-50 text-primary-600' },
    { id: 'orders', label: 'View Orders', to: '/orders', icon: FaClipboardList, color: 'from-blue-500 to-blue-700', iconBg: 'bg-blue-50 text-blue-600' },
    { id: 'track', label: 'Track Orders', to: '/orders', icon: FaTruck, color: 'from-emerald-500 to-emerald-700', iconBg: 'bg-emerald-50 text-emerald-600' },
    { id: 'wishlist', label: 'Wishlist', to: '/wishlist', icon: FaHeart, color: 'from-pink-500 to-rose-600', iconBg: 'bg-pink-50 text-pink-600' },
    { id: 'profile', label: 'Profile', to: '/profile', icon: FaUser, color: 'from-gold-400 to-gold-600', iconBg: 'bg-gold-50 text-gold-600' },
  ];

  return (
    <div className="min-h-screen bg-cream py-8">
      <div className="container-custom px-4 lg:px-8">
        {/* Welcome Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 px-6 py-10 text-white shadow-luxury sm:px-10">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-gold-400/15 blur-3xl" />
            <div className="absolute -left-16 -bottom-16 h-72 w-72 rounded-full bg-pink-500/15 blur-3xl" />
            <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-2xl" />
          </div>
          <div className="relative flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-300">Namaste,</p>
              <h1 className="mt-2 font-serif text-3xl font-bold text-white sm:text-4xl">
                {firstName}! 🙏
              </h1>
              <p className="mt-2 text-white/90">
                <ContinuousTypewriter
                  words={['Welcome back to Sunita\'z Collection', 'Great to see you again', 'Your style journey continues']}
                  speed={80}
                  deleteSpeed={50}
                  pause={2000}
                />
              </p>
              <p className="mt-2 text-sm text-white/70">
                Here is what is happening with your orders.
              </p>
            </div>
            <Avatar src={profile?.avatar} name={profile?.name || user?.name} size="lg" showBorder={true} borderColor="border-white/40" />
          </div>
        </div>

        {/* Order Summary Cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { icon: FaBoxOpen, label: 'Total Orders', value: orderSummary.totalOrders, to: '/orders', color: 'bg-primary-50 text-primary-600' },
            { icon: FaTruck, label: 'Active Orders', value: orderSummary.active, to: '/orders', color: 'bg-blue-50 text-blue-600' },
            { icon: FaCheckCircle, label: 'Delivered', value: orderSummary.delivered, to: '/orders', color: 'bg-emerald-50 text-emerald-600' },
            { icon: FaTimesCircle, label: 'Cancelled', value: orderSummary.cancelled, to: '/orders', color: 'bg-red-50 text-red-600' },
            { icon: FaHeart, label: 'Wishlist', value: wishlistCount, to: '/wishlist', color: 'bg-pink-50 text-pink-600' },
          ].map(({ icon: Icon, label, value, to, color }) => (
            <Link key={label} to={to} className="group relative overflow-hidden rounded-3xl border border-gold/20 bg-white p-5 shadow-card transition hover:shadow-luxury">
              <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-gold-100/40 blur-xl transition group-hover:scale-150" />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-sm text-ink-light">{label}</p>
                  <p className="mt-1 text-2xl font-bold text-ink">{value}</p>
                </div>
                <div className={`rounded-2xl p-3 ${color}`}><Icon className="text-xl" /></div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {quickActions.map((a) => (
            <Link
              key={a.id}
              to={a.to}
              className="group relative overflow-hidden rounded-2xl border border-gold/20 bg-white p-4 shadow-card transition hover:shadow-luxury"
            >
              <div className="absolute -right-3 -top-3 h-12 w-12 rounded-full bg-pink-100/40 blur-xl transition group-hover:scale-125" />
              <div className="relative flex items-center gap-3">
                <div className={`rounded-xl p-2.5 ${a.iconBg}`}><a.icon /></div>
                <span className="text-sm font-semibold text-ink">{a.label}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Spending Summary */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="group relative overflow-hidden rounded-3xl border border-gold/20 bg-white p-5 shadow-card transition hover:shadow-luxury">
            <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-gold-100/40 blur-xl transition group-hover:scale-150" />
            <div className="relative">
              <div className="flex items-center gap-2">
                <FaStar className="text-gold-500" />
                <p className="text-sm text-ink-light">Total Spent</p>
              </div>
              <p className="mt-1 text-2xl font-bold text-ink">{money(totalSpent)}</p>
            </div>
          </div>
          <div className="group relative overflow-hidden rounded-3xl border border-gold/20 bg-white p-5 shadow-card transition hover:shadow-luxury">
            <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-pink-100/40 blur-xl transition group-hover:scale-150" />
            <div className="relative">
              <div className="flex items-center gap-2">
                <FaShoppingBag className="text-primary-500" />
                <p className="text-sm text-ink-light">Avg Order Value</p>
              </div>
              <p className="mt-1 text-2xl font-bold text-ink">{money(avgOrderValue)}</p>
            </div>
          </div>
          <div className="group relative overflow-hidden rounded-3xl border border-gold/20 bg-white p-5 shadow-card transition hover:shadow-luxury">
            <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-blue-100/40 blur-xl transition group-hover:scale-150" />
            <div className="relative">
              <div className="flex items-center gap-2">
                <FaClock className="text-emerald-500" />
                <p className="text-sm text-ink-light">Wallet / Balance</p>
              </div>
              <p className="mt-1 text-2xl font-bold text-ink">{money(d.wallet?.balance)}</p>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <section className="mt-8 rounded-3xl border border-gold/20 bg-white p-5 shadow-card sm:p-8">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink">Recent Orders</h2>
            <Link to="/orders" className="flex items-center gap-1 text-sm font-semibold text-primary-600 transition hover:text-primary-800">
              View all <FaArrowRight />
            </Link>
          </div>
          {orders.length ? (
            <div className="space-y-3">
              {orders.slice(0, 6).map((order) => (
                <div key={order._id} className="group relative overflow-hidden rounded-2xl border border-gold/10 bg-cream/60 p-4 transition hover:border-gold/30">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink">{order.orderNumber}</p>
                      <p className="mt-0.5 text-xs text-ink-light">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ''} • {money(order.totalAmount)}
                      </p>
                      {order.trackingNumber && (
                        <p className="mt-0.5 text-[11px] text-primary-600">Tracking: {order.trackingNumber}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE[order.orderStatus] || 'bg-gray-100 text-gray-700'}`}>
                        {order.orderStatus}
                      </span>
                      <button
                        type="button"
                        onClick={() => reorder(order)}
                        className="text-xs font-semibold text-primary-600 transition hover:text-primary-800"
                      >
                        Reorder
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gold/30 bg-cream/60 p-8 text-center">
              <p className="text-sm text-ink-light">No orders yet — your order history will appear here.</p>
              <Link to="/shop" className="mt-3 inline-block rounded-full bg-primary-600 px-6 py-2 text-sm font-semibold text-white shadow-md transition hover:scale-105 hover:bg-primary-700">
                Start Shopping
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
