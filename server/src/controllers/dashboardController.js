const User = require('../Models/User');
const Order = require('../Models/Order');

// Minimal, crash-free customer dashboard. It ONLY queries the current user and
// their own orders. No recommendation engine, no insights service, no loyalty
// service, no conversation aggregation — all of which caused the previous
// dashboard to time out, crash, or disconnect the database.
exports.getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [userResult, ordersResult] = await Promise.allSettled([
      User.findById(userId),
      Order.find({ user: userId }).sort({ createdAt: -1 }).limit(6),
    ]);

    if (userResult.status === 'rejected' || !userResult.value) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    const user = userResult.value;
    const orders = ordersResult.status === 'fulfilled' ? ordersResult.value : [];

    const orderSummary = {
      totalOrders: orders.length,
      active: orders.filter((o) => ['pending', 'confirmed', 'processing', 'packed', 'shipped'].includes(o.orderStatus)).length,
      delivered: orders.filter((o) => o.orderStatus === 'delivered').length,
      cancelled: orders.filter((o) => o.orderStatus === 'cancelled').length,
      recentOrders: orders,
    };

    res.status(200).json({
      success: true,
      dashboard: {
        user: {
          name: user.name,
          avatar: user.avatar,
          email: user.email,
        },
        orderSummary,
        wallet: { balance: user.wallet?.balance || 0 },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get notifications
exports.getNotifications = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('notifications');
    const notifications = (user?.notifications || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.status(200).json({ success: true, notifications });
  } catch (error) {
    next(error);
  }
};

// Mark notifications as read
exports.markNotificationsRead = async (req, res, next) => {
  try {
    await User.updateOne(
      { _id: req.user.id, 'notifications.read': false },
      { $set: { 'notifications.$[].read': true } }
    );
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

// Update style profile (kept for backward compatibility with Profile page edits)
exports.updateStyleProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const current = user.styleProfile || {};

    const nextProfile = {
      sizes: {
        ...(current.sizes || {}),
        footwear: req.body.shoeSize ?? current.sizes?.footwear,
        top: req.body.dressSize ?? current.sizes?.top,
        bottom: req.body.dressSize ?? current.sizes?.bottom,
      },
      preferences: {
        colors: req.body.preferredColors ?? current.preferences?.colors,
        styles: req.body.preferences ?? current.preferences?.styles,
        occasions: req.body.occasions ?? current.preferences?.occasions,
        priceRange: req.body.priceRange ?? current.preferences?.priceRange,
      },
      fitPreference: req.body.fitPreference ?? current.fitPreference,
      language: req.body.language ?? current.language,
    };

    user.styleProfile = nextProfile;
    await user.save();
    res.status(200).json({ success: true, styleProfile: user.styleProfile });
  } catch (error) {
    next(error);
  }
};
