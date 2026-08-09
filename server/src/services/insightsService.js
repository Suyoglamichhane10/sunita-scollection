// Shopping insights & activity feed service for the personalized dashboard.
// Computes spending patterns, category breakdown, avg order value, recent
// activity feed, and price-drop alerts from existing Order/ProductView/User data.

const Order = require('../Models/Order');
const ProductView = require('../Models/ProductView');
const User = require('../Models/User');
const Product = require('../Models/Product');

// Monthly spending pattern over the last 6 months
exports.getSpendingPattern = async (userId) => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const orders = await Order.find({
    user: userId,
    createdAt: { $gte: sixMonthsAgo },
    orderStatus: { $ne: 'cancelled' },
  });

  const labels = [];
  const data = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(d.toLocaleString('en-US', { month: 'short' }));
    data.push(0);
  }

  orders.forEach((o) => {
    const d = new Date(o.createdAt);
    const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
    const nowKey = `${now.getFullYear()}-${now.getMonth()}`;
    const diffMonths = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
    if (diffMonths >= 0 && diffMonths <= 5) {
      data[5 - diffMonths] += o.totalAmount || 0;
    }
  });

  return { labels, data, total: data.reduce((a, b) => a + b, 0) };
};

// Category breakdown of all purchases
exports.getCategoryBreakdown = async (userId) => {
  const orders = await Order.find({ user: userId, orderStatus: { $ne: 'cancelled' } });
  const productIds = new Set();
  orders.forEach((o) => (o.items || []).forEach((i) => productIds.add(i.product?.toString())));
  const products = await Product.find({ _id: { $in: Array.from(productIds) } }).select('category name');
  const Category = require('../Models/Category');
  const categories = await Category.find().select('name');

  const catMap = {};
  categories.forEach((c) => (catMap[c._id.toString()] = c.name));

  const breakdown = {};
  products.forEach((p) => {
    const name = catMap[p.category?.toString()] || 'Other';
    breakdown[name] = (breakdown[name] || 0) + 1;
  });

  return Object.entries(breakdown)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
};

// Average order value + totals
exports.getOrderStats = async (userId) => {
  const orders = await Order.find({ user: userId, orderStatus: { $ne: 'cancelled' } });
  const totalSpent = orders.reduce((a, o) => a + (o.totalAmount || 0), 0);
  const avgOrderValue = orders.length ? Math.round(totalSpent / orders.length) : 0;
  return { totalOrders: orders.length, totalSpent, avgOrderValue };
};

// Unified recent activity feed (orders, views, reviews, rewards)
exports.getActivityFeed = async (userId, limit = 10) => {
  const activities = [];

  const orders = await Order.find({ user: userId }).sort({ createdAt: -1 }).limit(limit);
  orders.forEach((o) =>
    activities.push({
      type: 'order',
      title: `Order ${o.orderNumber}`,
      detail: `${o.orderStatus} · Rs. ${o.totalAmount}`,
      createdAt: o.createdAt,
      meta: { orderId: o._id },
    })
  );

  const views = await ProductView.find({ user: userId })
    .sort({ viewedAt: -1 })
    .limit(limit)
    .populate('product', 'name images');
  views.forEach((v) =>
    activities.push({
      type: 'view',
      title: `Viewed ${v.product?.name || 'a product'}`,
      detail: 'Browsing',
      createdAt: v.viewedAt,
      meta: { productId: v.product?._id, image: v.product?.images?.[0]?.url },
    })
  );

  const user = await User.findById(userId).select('orders reviews notifications');
  const gam = user?.loyalty ? await require('../Models/Gamification').findById(user.loyalty) : null;
  if (gam) {
    activities.push({
      type: 'reward',
      title: `${gam.tier} tier · ${gam.points} points`,
      detail: 'Loyalty program',
      createdAt: gam.updatedAt || gam.createdAt,
    });
    (gam.badges || []).forEach((b) =>
      activities.push({
        type: 'badge',
        title: `Earned badge: ${b.name}`,
        detail: b.description || '',
        createdAt: b.earnedAt,
      })
    );
  }

  return activities
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
};

// Price-drop alerts: wishlist items whose current price dropped from last seen
exports.getPriceDropAlerts = async (userId) => {
  const user = await User.findById(userId).populate('wishlist');
  const wishlist = user?.wishlist || [];
  const alerts = [];

  for (const product of wishlist) {
    if (!product) continue;
    const lastView = await ProductView.findOne({ user: userId, product: product._id }).sort({ viewedAt: -1 });
    const lastSeenPrice = lastView?.price || product.price;
    if (product.price < lastSeenPrice) {
      alerts.push({
        productId: product._id,
        name: product.name,
        image: product.images?.[0]?.url || '',
        currentPrice: product.price,
        previousPrice: lastSeenPrice,
        dropPercent: Math.round(((lastSeenPrice - product.price) / lastSeenPrice) * 100),
      });
    }
  }
  return alerts;
};

// Quick actions for the dashboard
exports.getQuickActions = async (userId) => {
  const user = await User.findById(userId).select('cart wishlist recentlyViewed savedLooks');
  const gam = user?.loyalty ? await require('../Models/Gamification').findById(user.loyalty) : null;
  const actions = [
    { id: 'shop', label: 'Shop New Arrivals', to: '/shop', icon: 'cart' },
    { id: 'rewards', label: 'View Rewards', to: '/rewards', icon: 'gift' },
    { id: 'orders', label: 'Track Orders', to: '/orders', icon: 'truck' },
    { id: 'style', label: 'Update Style Profile', to: '/profile', icon: 'user' },
  ];
  if (user?.cart?.length) actions.unshift({ id: 'checkout', label: `Checkout (${user.cart.length} items)`, to: '/checkout', icon: 'checkout' });
  if (user?.savedLooks?.length) actions.push({ id: 'looks', label: 'My Saved Looks', to: '/dashboard', icon: 'look' });
  if (gam && !gam.spinWheel || (gam && gam.spinWheel && gam.spinWheel.lastSpinAt)) {
    actions.push({ id: 'spin', label: 'Spin the Wheel', to: '/rewards', icon: 'spin' });
  }
  return actions;
};
