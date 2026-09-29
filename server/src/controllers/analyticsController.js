const Order = require('../Models/Order');
const Product = require('../Models/Product');
const User = require('../Models/User');
const Review = require('../Models/Review');
const Message = require('../Models/Message');
const Enquiry = require('../Models/Enquiry');

exports.getRevenueAnalytics = async (req, res, next) => {
  try {
    const range = req.query.range || 'monthly';
    const orders = await Order.find({ orderStatus: { $ne: 'cancelled' } });

    const formatKey = (date, unit) => {
      const d = new Date(date);
      if (unit === 'daily') return d.toISOString().slice(0, 10);
      if (unit === 'weekly') {
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

    const repeatCustomers = orderStats.filter((o) => o.orderCount > 1).length;

    res.status(200).json({
      success: true,
      data: {
        totalCustomers,
        newThisMonth,
        avgOrderValue: Math.round(avgOrderValue),
        totalCustomerValue: orderStats.reduce((acc, o) => acc + o.totalSpent, 0),
        recentCustomers,
        repeatCustomers,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getComparison = async (req, res, next) => {
  try {
    const period = req.query.period || 'monthly';
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

exports.getEnquiryStats = async (req, res, next) => {
  try {
    const total = await Enquiry.countDocuments();
    const pending = await Enquiry.countDocuments({ status: 'pending' });
    const approved = await Enquiry.countDocuments({ status: 'approved' });
    const rejected = await Enquiry.countDocuments({ status: 'rejected' });
    const converted = await Enquiry.countDocuments({ status: 'converted' });

    const daily = await Enquiry.aggregate([
      { $match: { createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } } },
      { $group: { _id: null, count: { $sum: 1 } } },
    ]);

    const weekly = await Enquiry.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      },
      { $group: { _id: null, count: { $sum: 1 } } },
    ]);

    const mostEnquired = await Enquiry.aggregate([
      { $group: { _id: '$productId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          productId: '$_id',
          name: { $ifNull: ['$product.name', 'Unknown'] },
          count: 1,
        },
      },
    ]);

    const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        total,
        daily: daily[0]?.count || 0,
        weekly: weekly[0]?.count || 0,
        pending,
        approved,
        rejected,
        converted,
        conversionRate,
        mostEnquired,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getPaymentBreakdown = async (req, res, next) => {
  try {
    const breakdown = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'cancelled' } } },
      { $group: { _id: '$paymentMethod', count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
      { $sort: { revenue: -1 } },
    ]);

    const totalRevenue = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
    ]);

    const avgOrderValue = totalRevenue[0] ? Math.round(totalRevenue[0].total / totalRevenue[0].count) : 0;

    const paymentMethods = ['cod', 'esewa', 'fonepay'];
    const result = paymentMethods.map((method) => {
      const entry = breakdown.find((b) => b._id === method);
      return {
        method,
        count: entry?.count || 0,
        revenue: entry?.revenue || 0,
        percentage: totalRevenue[0] && totalRevenue[0].total > 0
          ? Math.round((entry?.revenue || 0) / totalRevenue[0].total * 100)
          : 0,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        breakdown: result,
        totalRevenue: totalRevenue[0]?.total || 0,
        totalOrders: totalRevenue[0]?.count || 0,
        averageOrderValue: avgOrderValue,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getBestSellingByRevenue = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const products = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          quantity: { $sum: '$items.quantity' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          productId: '$_id',
          name: { $ifNull: ['$product.name', 'Unknown'] },
          revenue: 1,
          quantity: 1,
          orderCount: 1,
          image: { $ifNull: ['$product.images.0.url', ''] },
        },
      },
    ]);

    res.status(200).json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};
