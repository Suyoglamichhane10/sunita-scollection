// AI-powered recommendation engine using collaborative filtering.
// Computes item-to-item affinity based on purchase/view history and
// user style profile to produce personalized recommendations.

const Product = require('../Models/Product');
const Order = require('../Models/Order');
const ProductView = require('../Models/ProductView');
const User = require('../Models/User');

// Build a set of product IDs the user has interacted with (viewed or purchased)
const getUserInteractionProducts = async (userId) => {
  const views = await ProductView.find({ user: userId }).distinct('product');
  const orders = await Order.find({ user: userId }).select('items');
  const ordered = new Set();
  orders.forEach((o) => {
    (o.items || []).forEach((it) => ordered.add(it.product.toString()));
  });
  const viewed = new Set(views.map((v) => v.toString()));
  return { viewed: Array.from(viewed), ordered: Array.from(ordered) };
};

// Item-to-item collaborative filtering: find products frequently purchased
// or viewed together in the same category
exports.getCollaborativeRecommendations = async (userId, limit = 6) => {
  try {
    const { ordered } = await getUserInteractionProducts(userId);

    if (!ordered.length) {
      // Cold start: fall back to popular products
      return Product.find({ isActive: true })
        .sort({ soldCount: -1, rating: -1 })
        .limit(limit)
        .populate('category', 'name');
    }

    // Find the categories the user has purchased from
    const purchasedProducts = await Product.find({ _id: { $in: ordered } }).select('category');
    const categoryIds = purchasedProducts.map((p) => p.category).filter(Boolean);

    // Recommend top-rated active products in those categories, excluding purchased
    return Product.find({
      isActive: true,
      category: { $in: categoryIds },
      _id: { $nin: ordered },
    })
      .sort({ rating: -1, soldCount: -1 })
      .limit(limit)
      .populate('category', 'name');
  } catch (error) {
    return Product.find({ isActive: true }).sort({ soldCount: -1 }).limit(limit);
  }
};

// Complementary items based on what's in the cart (cross-sell)
exports.getComplementaryItems = async (cartProductIds, limit = 4) => {
  try {
    if (!cartProductIds || !cartProductIds.length) return [];
    const cartProducts = await Product.find({ _id: { $in: cartProductIds } }).select('category');
    const categoryIds = cartProducts.map((p) => p.category).filter(Boolean);
    return Product.find({
      isActive: true,
      category: { $in: categoryIds },
      _id: { $nin: cartProductIds },
    })
      .sort({ soldCount: -1 })
      .limit(limit)
      .populate('category', 'name');
  } catch (error) {
    return [];
  }
};

// Trending products based on user's style profile (occasion/style preferences)
exports.getTrendingForUser = async (userId, limit = 6) => {
  try {
    const user = await User.findById(userId).select('styleProfile');
    const styles = user?.styleProfile?.preferences?.styles || [];
    const occasions = user?.styleProfile?.preferences?.occasions || [];

    const tagFilter = [];
    if (styles.length) tagFilter.push({ tags: { $in: styles } });
    if (occasions.length) tagFilter.push({ tags: { $in: occasions } });

const query = { isActive: true };
    if (tagFilter.length) query.$or = tagFilter;

    const results = await Product.find(query)
      .sort({ soldCount: -1, rating: -1 })
      .limit(limit)
      .populate('category', 'name');

    // Fallback: if the user has no style profile (cold start) there are no
    // tag filters, but ensure we always return something popular so the
    // dashboard "Trending" section is never empty.
    return results.length
      ? results
      : Product.find({ isActive: true })
          .sort({ soldCount: -1, rating: -1 })
          .limit(limit)
          .populate('category', 'name');
  } catch (error) {
    return Product.find({ isActive: true }).sort({ soldCount: -1 }).limit(limit);
  }
};

// "Recommended for you" — combines collaborative + trending
exports.getRecommendedForYou = async (userId, limit = 8) => {
  const [collaborative, trending] = await Promise.all([
    exports.getCollaborativeRecommendations(userId, limit),
    exports.getTrendingForUser(userId, limit),
  ]);
  const seen = new Set();
  const merged = [];
  [...collaborative, ...trending].forEach((p) => {
    if (!seen.has(p._id.toString()) && merged.length < limit) {
      seen.add(p._id.toString());
      merged.push(p);
    }
  });
  return merged;
};

// Recently viewed products (with quick-reorder support)
exports.getRecentlyViewed = async (userId, limit = 6) => {
  const user = await User.findById(userId).select('recentlyViewed').populate({
    path: 'recentlyViewed.product',
    populate: { path: 'category', select: 'name' },
  });
  return (user?.recentlyViewed || [])
    .map((rv) => rv.product)
    .filter(Boolean) // drop deleted/missing products so they never crash the dashboard
    .slice(0, limit);
};

// Size recommendation engine based on past purchases
exports.recommendSize = (product, user) => {
  const sizes = user?.styleProfile?.sizes || {};
  const productTags = product.tags || [];
  let size = null;
  if (productTags.some((t) => t.toLowerCase().includes('footwear') || t.toLowerCase().includes('sandals'))) {
    size = sizes.footwear;
  } else if (productTags.some((t) => t.toLowerCase().includes('saree'))) {
    size = sizes.sareeLength;
  } else {
    size = sizes.top || sizes.bottom;
  }
  return size || null;
};
