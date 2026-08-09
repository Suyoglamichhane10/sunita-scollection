import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaBoxOpen, FaTruck, FaStar, FaComments, FaFire,
  FaArrowRight, FaTrophy, FaMedal, FaClock,
  FaTags, FaBolt, FaShoppingBag, FaHeart,
  FaChartLine, FaEye, FaSlidersH,
} from 'react-icons/fa';
import api from '../../Services/api';
import { useAuth } from '../../Context/Authcontext';
import { useCart } from '../../Context/CartContext';
import { useChat } from '../../Context/ChatContext';
import toast from 'react-hot-toast';
// Chart logic is isolated in its own lazy chunk so a chart.js runtime failure
// can never blank the whole dashboard. It is additionally wrapped in a
// SectionErrorBoundary below.
import SpendingChart from '../../components/charts/SpendingChart';
import SectionErrorBoundary from '../../components/common/SectionErrorBoundary';

const TIER_STYLES = {
  Bronze: 'from-amber-700 to-amber-500',
  Silver: 'from-gray-400 to-gray-300',
  Gold: 'from-yellow-500 to-yellow-300',
  Platinum: 'from-slate-500 to-slate-300',
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

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=70';

const nonNull = (items) => (Array.isArray(items) ? items.filter(Boolean) : []);

const money = (n) => `Rs. ${Number(n || 0).toLocaleString()}`;

const ProductMiniCard = ({ p, addToCart }) => {
  if (!p || !p._id) return null;
  const price = p.variants?.[0]?.price ?? p.price;
  const image = p.images?.[0]?.url || FALLBACK_IMG;
  return (
    <div className="w-44 shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
      <Link to={`/product/${p._id}`} className="block">
        <img src={image} alt={p.name} className="h-36 w-full object-cover" loading="lazy" />
      </Link>
      <div className="p-3">
        <Link to={`/product/${p._id}`} className="line-clamp-1 text-sm font-semibold text-gray-900 hover:text-pink-700">
          {p.name}
        </Link>
        <div className="mt-1 flex items-center gap-1 text-xs">
          <FaStar className="text-yellow-400" />
          <span className="font-semibold text-gray-700">{p.rating?.average || 'New'}</span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-pink-600">{money(price)}</p>
          <button
            type="button"
            onClick={() => addToCart(p, 1, p.variants?.[0] || null)}
            className="rounded-full bg-pink-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-pink-700"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const { addToCart } = useCart();
  const { socketRef } = useChat();
  const navigate = useNavigate();

  const [dash, setDash] = useState(null);
  const [fallbackProducts, setFallbackProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiFailed, setApiFailed] = useState(false);

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
        if (active) setDash(data.dashboard);
      } catch (error) {
        console.error('Dashboard API failed:', error);
        if (active) setApiFailed(true);
      }

      try {
        const prodRes = await api.get('/products', { params: { sort: 'newest', limit: 8 } });
        if (active) setFallbackProducts(prodRes.data?.products || []);
      } catch (error) {
        console.error('Failed to load fallback catalogue:', error);
      }

      if (active) setLoading(false);
    };

    loadDashboard();

    // Safety net: never leave the user stuck on the loading skeleton. If the
    // API calls hang or are slow, show the dashboard content after 5s using
    // any data we have (personalized or fallback catalogue).
    const timeout = setTimeout(() => {
      if (active) setLoading(false);
    }, 5000);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    const recentOrders = dash?.orderSummary?.recentOrders;
    if (!recentOrders?.length || !socketRef?.current) return;

    const orderIds = recentOrders.map((o) => o._id);
    orderIds.forEach((id) => socketRef.current.emit('join-order', id));

    const onOrderStatus = (update) => {
      setDash((prev) => {
        if (!prev?.orderSummary?.recentOrders) return prev;
        return {
          ...prev,
          orderSummary: {
            ...prev.orderSummary,
            recentOrders: prev.orderSummary.recentOrders.map((o) =>
              o._id === update.orderId
                ? { ...o, orderStatus: update.orderStatus, trackingNumber: update.trackingNumber, statusHistory: update.statusHistory }
                : o
            ),
          },
        };
      });
      toast.success(`Order updated: ${update.orderStatus}`);
    };

    socketRef.current.on('order:status', onOrderStatus);
    return () => {
      orderIds.forEach((id) => socketRef.current?.emit('leave-order', id));
      socketRef.current?.off('order:status', onOrderStatus);
    };
  }, [dash?.orderSummary?.recentOrders, socketRef]);

  const d = dash || {};
  const loyalty = d.loyalty || { tier: 'Bronze', points: 0, nextTier: null, progressToNext: 100, badges: [] };
  const orderSummary = d.orderSummary || { totalOrders: 0, active: 0, delivered: 0, cancelled: 0, recentOrders: [] };
  const profile = d.user || { name: user?.name || 'there', avatar: user?.avatar || null };
  const insights = d.insights || null;
  const conversations = nonNull(d.conversations);
  const activityFeed = nonNull(d.activityFeed);
  const priceDropAlerts = nonNull(d.priceDropAlerts);
  const quickActions = Array.isArray(d.quickActions) && d.quickActions.length
    ? d.quickActions
    : [
        { id: 'shop', label: 'Shop New Arrivals', to: '/shop' },
        { id: 'cart', label: 'View Cart', to: '/cart' },
        { id: 'orders', label: 'Track Orders', to: '/orders' },
        { id: 'wishlist', label: 'My Wishlist', to: '/wishlist' },
        { id: 'rewards', label: 'Rewards', to: '/rewards' },
        { id: 'style', label: 'Style Profile', to: '/profile' },
      ];

  const recommended = nonNull(d.recommended).length ? nonNull(d.recommended) : fallbackProducts;
  const trending = nonNull(d.trending).length ? nonNull(d.trending) : fallbackProducts;
  const recentlyViewed = nonNull(d.recentlyViewed);
  const recentOrders = nonNull(orderSummary.recentOrders);
  const wishlistCount = d.user?.wishlistCount ?? 0;
  const cartCount = d.user?.cartCount ?? 0;

  const spendingPattern = insights?.spendingPattern || { labels: [], data: [] };
  const hasChartData = spendingPattern.labels?.length > 0 && spendingPattern.data?.some((v) => v > 0);

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
      toast.success('Items added to cart');
      navigate('/cart');
    } catch (error) {
      toast.error('Unable to reorder');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="container-custom px-4 lg:px-8">
          <div className="h-40 animate-pulse rounded-3xl bg-gradient-to-br from-gray-200 to-gray-100" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-3xl bg-gray-200" />
            ))}
          </div>
          <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-8">
              <div className="h-72 animate-pulse rounded-3xl bg-gray-200" />
              <div className="h-72 animate-pulse rounded-3xl bg-gray-200" />
            </div>
            <div className="space-y-8">
              <div className="h-64 animate-pulse rounded-3xl bg-gray-200" />
              <div className="h-64 animate-pulse rounded-3xl bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom px-4 lg:px-8">
        {apiFailed && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <FaBolt className="mt-0.5 shrink-0" />
            <span>
              We&apos;re having trouble loading your personalized data right now.
              Here are our latest picks to keep you shopping. Your account and orders are safe.
            </span>
          </div>
        )}

        <div className={`overflow-hidden rounded-3xl bg-gradient-to-br ${TIER_STYLES[loyalty.tier] || 'from-pink-600 to-rose-700'} p-8 text-white shadow-lg`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-white/80">Namaste,</p>
              <h1 className="text-3xl font-bold">
                {String(profile?.name || user?.name || 'there').split(' ')[0]}! 🌸
              </h1>
              <p className="mt-2 text-white/90">
                {recentOrders.length
                  ? 'Welcome back — here is what is happening with your orders.'
                  : 'Your personalized shopping hub is ready. Let’s find something you’ll love!'}
              </p>
            </div>
            <div className="flex items-center gap-4 rounded-2xl bg-white/15 px-5 py-3 backdrop-blur">
              <FaTrophy className="text-2xl" />
              <div>
                <p className="text-xs uppercase tracking-wide text-white/70">Loyalty Tier</p>
                <p className="text-xl font-bold">{loyalty.tier || 'Bronze'}</p>
              </div>
              <div className="h-8 w-px bg-white/30" />
              <div>
                <p className="text-xs uppercase tracking-wide text-white/70">Points</p>
                <p className="text-xl font-bold">{loyalty.points || 0}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 max-w-md">
            <div className="mb-1 flex items-center justify-between text-xs text-white/80">
              <span>Progress to {loyalty.nextTier || 'next tier'}</span>
              <span>{Math.min(100, loyalty.progressToNext ?? 0)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/25">
              <div
                className="h-full rounded-full bg-white transition-all"
                style={{ width: `${Math.min(100, loyalty.progressToNext ?? 0)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: FaBoxOpen, label: 'Active Orders', value: orderSummary.active ?? 0, to: '/orders' },
            { icon: FaTruck, label: 'Delivered', value: orderSummary.delivered ?? 0, to: '/orders' },
            { icon: FaHeart, label: 'Wishlist', value: wishlistCount, to: '/wishlist' },
            { icon: FaShoppingBag, label: 'Cart Items', value: cartCount, to: '/cart' },
          ].map(({ icon: Icon, label, value, to }) => (
            <Link key={label} to={to} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{label}</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
                </div>
                <div className="rounded-2xl bg-pink-50 p-3 text-pink-600"><Icon className="text-xl" /></div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {quickActions.map((a) => (
            <Link
              key={a.id}
              to={a.to}
              className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-pink-300 hover:shadow-md"
            >
              <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600"><FaBolt /></div>
              <span className="text-sm font-semibold text-gray-800">{a.label}</span>
            </Link>
          ))}
        </div>

        {priceDropAlerts.length > 0 && (
          <div className="mt-6 rounded-3xl border border-green-200 bg-green-50 p-5">
            <div className="mb-3 flex items-center gap-2">
              <FaTags className="text-green-600" />
              <h2 className="font-bold text-gray-900">Price Drops on Your Wishlist</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {priceDropAlerts.map((p) => (
                <Link key={p.productId} to={`/product/${p.productId}`} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
                  <img src={p.image} alt={p.name} className="h-12 w-12 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">{p.name}</p>
                    <p className="text-xs font-bold text-green-600">{money(p.currentPrice)}</p>
                  </div>
                  <span className="rounded-full bg-green-600 px-2 py-1 text-[11px] font-bold text-white">-{p.dropPercent}%</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-8">
            <section>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-pink-600">For you</p>
                  <h2 className="text-2xl font-bold text-gray-900">Recommended just for you</h2>
                </div>
                <Link to="/shop" className="flex items-center gap-1 text-sm font-semibold text-pink-600 hover:text-pink-800">
                  View all <FaArrowRight />
                </Link>
              </div>
              {recommended.length ? (
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {recommended.map((p) => (
                    <ProductMiniCard key={p._id} p={p} addToCart={addToCart} />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl bg-white p-6 text-center text-gray-500 shadow-sm">
                  Start exploring products to get personalized recommendations!
                  <Link to="/shop" className="mt-2 block font-semibold text-pink-600">Browse the shop</Link>
                </div>
              )}
            </section>

            <section>
              <div className="mb-4 flex items-center gap-2">
                <div className="flex items-center gap-1 rounded-lg bg-orange-500 px-2 py-1 text-xs font-bold text-white">
                  <FaFire /> FLASH SALE
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Trending for your style</h2>
              </div>
              {trending.length ? (
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {trending.map((p) => (
                    <ProductMiniCard key={p._id} p={p} addToCart={addToCart} />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl bg-white p-6 text-center text-gray-500 shadow-sm">No trending items yet — check back soon!</div>
              )}
            </section>

            {insights && (
              <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <FaChartLine className="text-pink-600" />
                  <h2 className="text-lg font-bold text-gray-900">Shopping Insights</h2>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <p className="text-xs text-gray-500">Total Spent</p>
                    <p className="text-xl font-bold text-gray-900">{money(insights.orderStats?.totalSpent)}</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <p className="text-xs text-gray-500">Avg Order Value</p>
                    <p className="text-xl font-bold text-gray-900">{money(insights.orderStats?.avgOrderValue)}</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <p className="text-xs text-gray-500">Orders</p>
                    <p className="text-xl font-bold text-gray-900">{insights.orderStats?.totalOrders || 0}</p>
                  </div>
                </div>
                {hasChartData && (
                  <div className="mt-4 h-48">
                    <SectionErrorBoundary
                      fallback={
                        <div className="flex h-48 items-center justify-center rounded-2xl bg-gray-50 text-sm text-gray-400">
                          Spending chart unavailable.
                        </div>
                      }
                    >
                      <SpendingChart labels={spendingPattern.labels} data={spendingPattern.data} />
                    </SectionErrorBoundary>
                  </div>
                )}
              </section>
            )}

            {activityFeed.length > 0 && (
              <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <FaClock className="text-blue-500" />
                  <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
                </div>
                <div className="space-y-2">
                  {activityFeed.slice(0, 8).map((act, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-2xl bg-gray-50 p-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        {act.image ? (
                          <img src={act.image} alt="" className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <FaBolt className="text-sm" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-900">{act.title}</p>
                        <p className="truncate text-xs text-gray-500">{act.detail}</p>
                      </div>
                      <span className="shrink-0 text-[11px] text-gray-400">
                        {act.createdAt ? new Date(act.createdAt).toLocaleDateString() : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="space-y-8">
            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
                <Link to="/orders" className="text-sm font-semibold text-pink-600 hover:text-pink-800">View all</Link>
              </div>
              {recentOrders.length ? (
                <div className="space-y-3">
                  {recentOrders.map((order) => (
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
                  <Link to="/shop" className="mt-2 block font-semibold text-pink-600">Start shopping</Link>
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FaSlidersH className="text-pink-600" />
                  <h2 className="text-lg font-bold text-gray-900">Style Profile</h2>
                </div>
                <Link to="/profile" className="text-sm font-semibold text-pink-600 hover:text-pink-800">Edit</Link>
              </div>
              {profile.styleProfile?.sizes || profile.styleProfile?.preferences ? (
                <div className="space-y-2 text-sm">
                  {(profile.styleProfile.sizes?.top || profile.styleProfile.sizes?.sareeLength) && (
                    <div className="flex justify-between rounded-2xl bg-gray-50 p-3">
                      <span className="text-gray-500">Top / Saree</span>
                      <span className="font-semibold text-gray-800">{profile.styleProfile.sizes.top || profile.styleProfile.sizes.sareeLength}</span>
                    </div>
                  )}
                  {profile.styleProfile.sizes?.footwear && (
                    <div className="flex justify-between rounded-2xl bg-gray-50 p-3">
                      <span className="text-gray-500">Footwear</span>
                      <span className="font-semibold text-gray-800">{profile.styleProfile.sizes.footwear}</span>
                    </div>
                  )}
                  {profile.styleProfile.fitPreference && (
                    <div className="flex justify-between rounded-2xl bg-gray-50 p-3">
                      <span className="text-gray-500">Fit</span>
                      <span className="font-semibold text-gray-800 capitalize">{profile.styleProfile.fitPreference}</span>
                    </div>
                  )}
                  {profile.styleProfile.preferences?.styles?.length > 0 && (
                    <div className="flex flex-wrap gap-2 rounded-2xl bg-gray-50 p-3">
                      <span className="text-gray-500">Styles:</span>
                      {profile.styleProfile.preferences.styles.map((s) => (
                        <span key={s} className="rounded-full bg-pink-100 px-2 py-0.5 text-xs font-semibold text-pink-700">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl bg-gray-50 p-4 text-center text-sm text-gray-500">
                  Complete your style profile to unlock personalized size & fit recommendations.
                  <Link to="/profile" className="mt-2 block font-semibold text-pink-600">Set up now</Link>
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <FaEye className="text-pink-600" />
                <h2 className="text-lg font-bold text-gray-900">Recently Viewed</h2>
              </div>
              {recentlyViewed.length ? (
                <div className="space-y-3">
                  {recentlyViewed.map((p) => (
                    <div key={p._id} className="flex items-center gap-3 rounded-2xl bg-gray-50 p-3">
                      <img src={p.images?.[0]?.url || FALLBACK_IMG} alt={p.name} className="h-12 w-12 rounded-xl object-cover" />
                      <div className="min-w-0 flex-1">
                        <Link to={`/product/${p._id}`} className="line-clamp-1 text-sm font-semibold text-gray-900 hover:text-pink-700">{p.name}</Link>
                        <p className="text-xs font-bold text-pink-600">{money(p.price)}</p>
                      </div>
                      <button type="button" onClick={() => addToCart(p, 1, p.variants?.[0] || null)} className="rounded-full bg-pink-600 px-3 py-1 text-xs font-semibold text-white">
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl bg-gray-50 p-6 text-center text-sm text-gray-500">
                  Products you browse will show up here for quick re-ordering.
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <FaMedal className="text-yellow-500" />
                <h2 className="text-lg font-bold text-gray-900">Your Badges</h2>
              </div>
              {nonNull(loyalty.badges).length ? (
                <div className="flex flex-wrap gap-2">
                  {loyalty.badges.map((b) => (
                    <span key={b.code} className="flex items-center gap-1 rounded-full bg-yellow-50 px-3 py-1.5 text-xs font-semibold text-yellow-700">
                      <FaStar className="text-xs" /> {b.name}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl bg-gray-50 p-4 text-center text-sm text-gray-500">
                  Earn badges by shopping, reviewing, and referring friends! <Link to="/rewards" className="font-semibold text-pink-600">See rewards</Link>
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FaComments className="text-pink-600" />
                  <h2 className="text-lg font-bold text-gray-900">Your Chats</h2>
                </div>
                <Link to="/messages" className="text-sm font-semibold text-pink-600 hover:text-pink-800">Open inbox</Link>
              </div>
              {conversations.length ? (
                <div className="space-y-2">
                  {conversations.slice(0, 4).map((c) => (
                    <Link
                      key={c._id}
                      to="/messages"
                      className="flex w-full items-center justify-between rounded-2xl bg-gray-50 p-3 text-left hover:bg-gray-100"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">{c.title || 'Support'}</p>
                        <p className="truncate text-xs text-gray-500">{c.lastMessagePreview || 'No messages'}</p>
                      </div>
                      {c.unreadCount > 0 && (
                        <span className="ml-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-pink-600 px-1.5 text-[11px] font-bold text-white">
                          {c.unreadCount}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl bg-gray-50 p-4 text-center text-sm text-gray-500">
                  No active conversations.
                  <Link to="/messages" className="mt-2 block w-full rounded-full bg-pink-600 py-2 text-sm font-semibold text-white">
                    Start a chat
                  </Link>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

