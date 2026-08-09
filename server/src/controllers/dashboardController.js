const User = require('../Models/User');
const Order = require('../Models/Order');
const ProductView = require('../Models/ProductView');
const Conversation = require('../Models/Conversation');
const Message = require('../Models/Message');
const loyaltyService = require('../services/loyaltyService');
const recommendationService = require('../services/recommendationService');
const insightsService = require('../services/insightsService');

// Aggregate all data needed for the personalized customer dashboard
exports.getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Use allSettled so ONE failing sub-module (recommendations, insights,
    // loyalty, activity feed, etc.) can NEVER take down the whole dashboard.
    // Each group resolves to either the real data or a safe default.
    const [
      userResult,
      ordersResult,
      loyaltyResult,
      recommendedResult,
      trendingResult,
      recentlyViewedResult,
      conversationsResult,
      unreadNotificationsResult,
    ] = await Promise.allSettled([
      User.findById(userId)
        .populate('wishlist')
        .populate({ path: 'cart.product', populate: { path: 'category' } }),
      Order.find({ user: userId }).sort({ createdAt: -1 }).limit(5),
      loyaltyService.getLoyaltySummary(userId),
      recommendationService.getRecommendedForYou(userId, 6),
      recommendationService.getTrendingForUser(userId, 6),
      recommendationService.getRecentlyViewed(userId, 6),
      Conversation.find({ participants: userId }).sort({ lastMessageAt: -1 }).limit(8),
      User.findById(userId).select('notifications'),
    ]);

    if (userResult.status === 'rejected' || !userResult.value) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    const user = userResult.value;

    const orders = ordersResult.status === 'fulfilled' ? ordersResult.value : [];
    const loyalty = loyaltyResult.status === 'fulfilled' ? loyaltyResult.value : null;
    const recommended = recommendedResult.status === 'fulfilled' ? recommendedResult.value : [];
    const trending = trendingResult.status === 'fulfilled' ? trendingResult.value : [];
    const recentlyViewed = recentlyViewedResult.status === 'fulfilled' ? recentlyViewedResult.value : [];
    const conversations = conversationsResult.status === 'fulfilled' ? conversationsResult.value : [];
    const unreadNotifications =
      unreadNotificationsResult.status === 'fulfilled' ? unreadNotificationsResult.value : null;

    // Order status summary
    const orderSummary = {
      totalOrders: orders.length,
      active: orders.filter((o) => ['pending', 'confirmed', 'processing', 'packed', 'shipped'].includes(o.orderStatus)).length,
      delivered: orders.filter((o) => o.orderStatus === 'delivered').length,
      cancelled: orders.filter((o) => o.orderStatus === 'cancelled').length,
      recentOrders: orders,
    };

    // Reward progress
    const rewardProgress = {
      points: loyalty?.points || 0,
      tier: loyalty?.tier || 'Bronze',
      nextTier: loyalty?.nextTier,
      progressToNext: loyalty?.progressToNext || 100,
      badges: loyalty?.gamification?.badges || [],
    };

// Unread notification count
    const unreadCount = (unreadNotifications?.notifications || []).filter((n) => !n.read).length;

    // Load shopping insights, activity feed, price-drop alerts, and quick actions
    const [spendingPattern, categoryBreakdown, orderStats, activityFeed, priceDropAlerts, quickActions] =
      await Promise.all([
        insightsService.getSpendingPattern(userId),
        insightsService.getCategoryBreakdown(userId),
        insightsService.getOrderStats(userId),
        insightsService.getActivityFeed(userId, 10),
        insightsService.getPriceDropAlerts(userId),
        insightsService.getQuickActions(userId),
      ]);

    res.status(200).json({
      success: true,
      dashboard: {
        user: {
          name: user.name,
          avatar: user.avatar,
          email: user.email,
          styleProfile: user.styleProfile,
          wishlistCount: user.wishlist?.length || 0,
          cartCount: user.cart?.length || 0,
        },
        orderSummary,
        loyalty: rewardProgress,
        recommended,
        trending,
        recentlyViewed,
        conversations,
        messagesUnread: conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0),
        unreadNotifications: unreadCount,
        insights: {
          spendingPattern,
          categoryBreakdown,
          orderStats: { ...orderStats, recentOrders: orderSummary.totalOrders },
        },
        activityFeed,
        priceDropAlerts,
        quickActions,
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
    const notifications = (user.notifications || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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

// Track product view (delegates to recommendation controller logic, kept here for dashboard)
exports.trackView = async (req, res, next) => {
  try {
    const { productId, source, timeSpent } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, message: 'productId is required' });
    }
    const Product = require('../Models/Product');
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    await ProductView.create({
      user: req.user.id,
      product: productId,
      category: product.category,
      source: source || 'direct',
      timeSpent: timeSpent || 0,
    });
    await User.findByIdAndUpdate(req.user.id, { $pull: { recentlyViewed: { product: productId } } });
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $push: { recentlyViewed: { product: productId, viewedAt: Date.now() } } },
      { new: true }
    );
    if (user.recentlyViewed.length > 12) {
      user.recentlyViewed = user.recentlyViewed.slice(-12);
      await user.save();
    }
    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
};

// Save look (outfit builder)
exports.saveLook = async (req, res, next) => {
  try {
    const { name, items, image } = req.body;
    if (!items || !items.length) {
      return res.status(400).json({ success: false, message: 'Items are required' });
    }
    const user = await User.findById(req.user.id);
    user.savedLooks.push({ name: name || 'My Look', items, image });
    await user.save();
    res.status(201).json({ success: true, savedLooks: user.savedLooks });
  } catch (error) {
    next(error);
  }
};

exports.getSavedLooks = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('savedLooks.items');
    res.status(200).json({ success: true, savedLooks: user.savedLooks || [] });
  } catch (error) {
    next(error);
  }
};

exports.deleteLook = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    user.savedLooks = user.savedLooks.filter((l) => l._id.toString() !== req.params.lookId);
    await user.save();
    res.status(200).json({ success: true, savedLooks: user.savedLooks });
  } catch (error) {
    next(error);
  }
};

// Update style profile
// Maps the flat frontend fields into the nested recommendation schema so that
// the recommendation engine (recommendSize, getTrendingForUser) reads correctly.
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
        sareeLength: req.body.sareeLength ?? current.sizes?.sareeLength,
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
