import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaBoxOpen, FaTruck, FaCheckCircle, FaTimesCircle,
  FaShoppingBag, FaClipboardList, FaUser, FaArrowRight,
  FaHeart,
} from 'react-icons/fa';
import api from '../../Services/api';
import { useAuth } from '../../Context/Authcontext';
import { useCart } from '../../Context/CartContext';
import Avatar from '../../components/common/Avatar';
import wishlistApi from '../../Services/wishlistApi';

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
      // Try the dedicated dashboard endpoint first. If it fails we fall back
      // to the user + orders endpoints so the page still renders useful data.
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

      // Fallback path: load profile + orders independently so a failure in one
      // never blanks the whole dashboard.
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

    // Safety net: never leave the user stuck on the loading state.
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
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="container-custom px-4 lg:px-8">
          <div className="h-40 animate-pulse rounded-3xl bg-gradient-to-br from-red-200 to-red-100" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-3xl bg-gray-200" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const quickActions = [
    { id: 'shop', label: 'Shop Now', to: '/shop', icon: FaShoppingBag },
    { id: 'orders', label: 'View Orders', to: '/orders', icon: FaClipboardList },
    { id: 'track', label: 'Track Orders', to: '/orders', icon: FaTruck },
    { id: 'wishlist', label: 'Wishlist', to: '/wishlist', icon: FaHeart },
    { id: 'profile', label: 'Profile', to: '/profile', icon: FaUser },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom px-4 lg:px-8">
        {/* Welcome header */}
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-red-600 to-rose-700 p-8 text-white shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-white/80">Namaste,</p>
              <h1 className="text-3xl font-bold">
                {String(profile?.name || user?.name || 'there').split(' ')[0]}! 🙏
              </h1>
              <p className="mt-2 text-white/90">
                Welcome back — here is what is happening with your orders.
              </p>
            </div>
            <Avatar src={profile?.avatar} name={profile?.name || user?.name} size="lg" showBorder={true} borderColor="border-white/60" />
          </div>
        </div>

        {/* Order summary cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { icon: FaBoxOpen, label: 'Total Orders', value: orderSummary.totalOrders, to: '/orders' },
            { icon: FaTruck, label: 'Active Orders', value: orderSummary.active, to: '/orders' },
            { icon: FaCheckCircle, label: 'Delivered', value: orderSummary.delivered, to: '/orders' },
            { icon: FaTimesCircle, label: 'Cancelled', value: orderSummary.cancelled, to: '/orders' },
            { icon: FaHeart, label: 'Wishlist', value: wishlistCount, to: '/wishlist' },
          ].map(({ icon: Icon, label, value, to }) => (
            <Link key={label} to={to} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{label}</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
                </div>
                <div className="rounded-2xl bg-red-50 p-3 text-red-600"><Icon className="text-xl" /></div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick actions */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {quickActions.map((a) => (
            <Link
              key={a.id}
              to={a.to}
              className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-red-300 hover:shadow-md"
            >
              <div className="rounded-xl bg-red-50 p-2.5 text-red-600"><a.icon /></div>
              <span className="text-sm font-semibold text-gray-800">{a.label}</span>
            </Link>
          ))}
        </div>

        {/* Spending summary */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total Spent</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{money(totalSpent)}</p>
          </div>
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Avg Order Value</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{money(avgOrderValue)}</p>
          </div>
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Wallet / Balance</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{money(d.wallet?.balance)}</p>
          </div>
        </div>

        {/* Recent orders */}
        <section className="mt-8 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
            <Link to="/orders" className="flex items-center gap-1 text-sm font-semibold text-red-600 hover:text-red-800">
              View all <FaArrowRight />
            </Link>
          </div>
          {orders.length ? (
            <div className="space-y-3">
              {orders.slice(0, 6).map((order) => (
                <div key={order._id} className="flex items-center justify-between rounded-2xl bg-gray-50 p-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{order.orderNumber}</p>
                    <p className="text-xs text-gray-500">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ''} • {money(order.totalAmount)}
                    </p>
                    {order.trackingNumber && (
                      <p className="mt-0.5 text-[11px] text-blue-600">Tracking: {order.trackingNumber}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE[order.orderStatus] || 'bg-gray-100 text-gray-700'}`}>
                      {order.orderStatus}
                    </span>
                    <button type="button" onClick={() => reorder(order)} className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                      Reorder
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-gray-50 p-6 text-center text-sm text-gray-500">
              No orders yet — your order history will appear here.
              <Link to="/shop" className="mt-2 block font-semibold text-red-600">Start shopping</Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
