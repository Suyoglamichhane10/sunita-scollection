const recommendationService = require('../services/recommendationService');
const ProductView = require('../Models/ProductView');
const User = require('../Models/User');

// Track a product view (browsing history)
exports.trackView = async (req, res, next) => {
  try {
    const { productId, source, timeSpent } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, message: 'productId is required' });
    }
    const product = await require('../Models/Product').findById(productId);
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

    // Update user's recentlyViewed list (cap at 12)
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { recentlyViewed: { product: productId } },
    });
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

// Recommended-for-you (machine-learning style collaborative filtering)
exports.getRecommendedForYou = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 8;
    const products = await recommendationService.getRecommendedForYou(req.user.id, limit);
    res.status(200).json({ success: true, products });
  } catch (error) {
    next(error);
  }
};

// Trending based on style profile
exports.getTrending = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 6;
    const products = await recommendationService.getTrendingForUser(req.user.id, limit);
    res.status(200).json({ success: true, products });
  } catch (error) {
    next(error);
  }
};

// Complementary items for cart
exports.getComplementary = async (req, res, next) => {
  try {
    const { productIds } = req.body;
    const products = await recommendationService.getComplementaryItems(productIds || [], parseInt(req.query.limit, 10) || 4);
    res.status(200).json({ success: true, products });
  } catch (error) {
    next(error);
  }
};

// Recently viewed products
exports.getRecentlyViewed = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 6;
    const products = await recommendationService.getRecentlyViewed(req.user.id, limit);
    res.status(200).json({ success: true, products });
  } catch (error) {
    next(error);
  }
};

// Size recommendation for a product
exports.getSizeRecommendation = async (req, res, next) => {
  try {
    const product = await require('../Models/Product').findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    const user = await User.findById(req.user.id);
    const size = recommendationService.recommendSize(product, user);
    res.status(200).json({ success: true, size });
  } catch (error) {
    next(error);
  }
};

// Save a look (outfit builder)
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
