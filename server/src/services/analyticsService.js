// Automated merchandising analytics.
// Keeps the admin-controlled "Best Seller" and "Trending" categories in sync
// with real order and interaction data so the catalogue stays fresh without
// requiring the admin to manually toggle every product.

const Product = require('../Models/Product');
const Order = require('../Models/Order');
const ProductView = require('../Models/ProductView');

// Mark the top-selling products as "Best Seller" automatically.
// A product qualifies when its soldCount is within the configured top-N and
// above the minimum threshold. Everything else is un-flagged so the admin can
// still manually override specific items afterwards.
exports.updateBestSellers = async ({ limit = 12, minSold = 1 } = {}) => {
  const topSellers = await Product.find({ soldCount: { $gte: minSold }, isActive: true })
    .sort({ soldCount: -1 })
    .limit(limit)
    .select('_id soldCount isBestSeller');

  const bestSellerIds = new Set(topSellers.map((p) => p._id.toString()));

  const bulkOps = [];
  for (const product of topSellers) {
    if (!product.isBestSeller) {
      bulkOps.push({ updateOne: { filter: { _id: product._id }, update: { isBestSeller: true } } });
    }
  }

  // Un-flag previously best-selling products that dropped out of the top list.
  const currentlyFlagged = await Product.find({ isBestSeller: true }).select('_id');
  for (const product of currentlyFlagged) {
    if (!bestSellerIds.has(product._id.toString())) {
      bulkOps.push({ updateOne: { filter: { _id: product._id }, update: { isBestSeller: false } } });
    }
  }

  if (bulkOps.length) {
    await Product.bulkWrite(bulkOps);
  }
  return bestSellerIds.size;
};

// Re-compute the trendingScore for every active product and flag the top items
// as "Trending". The score blends recent views, recent orders and total views
// so products with a current spike surface above evergreen popular items.
exports.updateTrending = async ({ windowDays = 14, topN = 12, minScore = 5 } = {}) => {
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

  const [recentViews, recentOrders] = await Promise.all([
    ProductView.aggregate([
      { $match: { viewedAt: { $gte: since } } },
      { $group: { _id: '$product', recentViews: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: since }, orderStatus: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.product', recentOrders: { $sum: '$items.quantity' } } },
    ]),
  ]);

  const recentViewMap = new Map(recentViews.map((v) => [v._id.toString(), v.recentViews]));
  const recentOrderMap = new Map(recentOrders.map((o) => [o._id.toString(), o.recentOrders]));

  const products = await Product.find({ isActive: true }).select('_id views soldCount trendingScore');
  const scored = products.map((p) => {
    const pid = p._id.toString();
    const views = p.views || 0;
    const recentViews = recentViewMap.get(pid) || 0;
    const recentOrders = recentOrderMap.get(pid) || 0;
    const score = Math.round(views * 0.4 + recentViews * 2 + recentOrders * 5);
    return { product: p, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const trendingIds = new Set(scored.slice(0, topN).filter((s) => s.score >= minScore).map((s) => s.product._id.toString()));

  const bulkOps = [];
  for (const { product, score } of scored) {
    const shouldTrend = trendingIds.has(product._id.toString());
    if (product.trendingScore !== score || product.isTrending !== shouldTrend) {
      bulkOps.push({
        updateOne: { filter: { _id: product._id }, update: { trendingScore: score, isTrending: shouldTrend } },
      });
    }
  }

  if (bulkOps.length) {
    await Product.bulkWrite(bulkOps);
  }
  return trendingIds.size;
};

// Convenience runner used by cron/route to refresh all automated categories.
exports.refreshMerchandising = async (options) => {
  const [bestSellers, trending] = await Promise.all([
    exports.updateBestSellers(options?.bestSellers || {}),
    exports.updateTrending(options?.trending || {}),
  ]);
  return { bestSellers, trending };
};
