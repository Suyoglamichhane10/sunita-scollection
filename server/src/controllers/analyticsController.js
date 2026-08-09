const Order = require('../Models/Order');
const Product = require('../Models/Product');
const User = require('../Models/User');
const Review = require('../Models/Review');
const Message = require('../Models/Message');

// @desc    Get revenue analytics (daily/weekly/monthly)
// @route   GET /api/analytics/revenue
// @access  Private/Admin
exports.getRevenueAnalytics = async (req, res, next) => {
  try {
    const range = req.query.range || 'monthly'; // daily | weekly | monthly | yearly
    const orders = await Order.find({ orderStatus: { $ne: 'cancelled' } });

    const formatKey = (date, unit) => {
      const d = new Date(date);
      if (unit === 'daily') return d.toISOString().slice(0, 10);
      if (unit === 'weekly') {
        // ISO week
        const temp = new Date(d);
        temp.setHours(0, 0, 0, 0);
        temp.setDate(temp.getDate() + 3 - ((temp.getDay() + 6) % 7));
        const week1 = new Date(temp.getFullYear(), 0, 4);
        const weekNum = 1 + Math.round(((temp - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
        return `${d.getFullYear()}-W${weekNum}`;
      }
      if (unit === 'monthly') return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return `${d.getFullYear()}`;
    };

    const grouped = {};
    const orderCounts = {};

    orders.forEach((order) => {
      const key = formatKey(order.createdAt, range);
      grouped[key] = (grouped[key] || 0) + (order.totalAmount || 0);
      orderCounts[key] = (orderCounts[key] || 0) + 1;
    });

    const labels = Object.keys(grouped).sort();
    const data = {
      range,
      labels,
      revenue: labels.map((label) => grouped[label]),
      orders: labels.map((label) => orderCounts[label]),
      totalRevenue: orders.reduce((acc, o) => acc + (o.totalAmount || 0), 0),
      totalOrders: orders.length,
    };

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// @desc    Get best-selling products
// @route   GET /api/analytics/best-sellers
// @access  Private/Admin
exports.getBestSellers = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const products = await Product.find()
      .sort({ soldCount: -1 })
      .limit(limit)
      .select('name price soldCount stock images rating');

    res.status(200).json({
      success: true,
      products: products.map((p) => ({
        _id: p._id,
        name: p.name,
        price: p.price,
        soldCount: p.soldCount,
        stock: p.stock,
        image: p.images?.[0]?.url || '',
        rating: p.rating?.average || 0,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get customer analytics
// @route   GET /api/analytics/customers
// @access  Private/Admin
exports.getCustomerAnalytics = async (req, res, next) => {
  try {
    const [totalCustomers, newThisMonth, orderStats, customerLifetimeValues, recentCustomers] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({
        role: 'customer',
        createdAt: {
          $gte: new Date(new Date().setDate(1)),
        },
      }),
      Order.aggregate([
        {
          $group: {
            _id: '$user',
            totalSpent: { $sum: '$totalAmount' },
            orderCount: { $sum: 1 },
          },
        },
      ]),
      User.find({ role: 'customer' }).sort({ createdAt: -1 }).limit(10).select('name email createdAt'),
    ]);

    const avgOrderValue =
      orderStats.length > 0
        ? orderStats.reduce((acc, o) => acc + o.totalSpent, 0) / orderStats.length
        : 0;

    res.status(200).json({
      success: true,
      data: {
        totalCustomers,
        newThisMonth,
        avgOrderValue: Math.round(avgOrderValue),
        totalCustomerValue: orderStats.reduce((acc, o) => acc + o.totalSpent, 0),
        recentCustomers,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get monthly/yearly comparison
// @route   GET /api/analytics/comparison
// @access  Private/Admin
exports.getComparison = async (req, res, next) => {
  try {
    const period = req.query.period || 'monthly'; // monthly | yearly
    const limit = parseInt(req.query.limit) || 12;

    const orders = await Order.find({ orderStatus: { $ne: 'cancelled' } });

    const formatKey = (date) => {
      const d = new Date(date);
      if (period === 'yearly') return `${d.getFullYear()}`;
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    };

    const grouped = {};
    orders.forEach((order) => {
      const key = formatKey(order.createdAt);
      grouped[key] = grouped[key] || { revenue: 0, orders: 0 };
      grouped[key].revenue += order.totalAmount || 0;
      grouped[key].orders += 1;
    });

    const entries = Object.entries(grouped).sort((a, b) => (a[0] > b[0] ? 1 : -1)).slice(-limit);

    res.status(200).json({
      success: true,
      data: {
        period,
        labels: entries.map(([key]) => key),
        revenue: entries.map(([, value]) => value.revenue),
        orders: entries.map(([, value]) => value.orders),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get overall dashboard analytics summary
// @route   GET /api/analytics/summary
// @access  Private/Admin
exports.getAnalyticsSummary = async (req, res, next) => {
  try {
    const [orders, products, customers, reviews, messages] = await Promise.all([
      Order.countDocuments(),
      Product.countDocuments(),
      User.countDocuments({ role: 'customer' }),
      Review.countDocuments({ isApproved: true }),
      Message.countDocuments({ status: 'new' }),
    ]);

    const revenueRes = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        orders,
        products,
        customers,
        reviews,
        newMessages: messages,
        revenue: revenueRes[0]?.total || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};
