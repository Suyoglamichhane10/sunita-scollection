const express = require('express');
const router = express.Router();
const {
  getRevenueAnalytics,
  getBestSellers,
  getCustomerAnalytics,
  getComparison,
  getAnalyticsSummary,
} = require('../controllers/analyticsController');
const analyticsService = require('../services/analyticsService');
const { protect, authorize } = require('../Middleware/auth');

// All analytics routes are admin-only
router.use(protect, authorize('admin'));

router.get('/revenue', getRevenueAnalytics);
router.get('/best-sellers', getBestSellers);
router.get('/customers', getCustomerAnalytics);
router.get('/comparison', getComparison);
router.get('/summary', getAnalyticsSummary);

// @desc    Recompute Best Seller + Trending categories from live data
// @route   POST /api/analytics/refresh-merchandising
// @access  Private/Admin
router.post('/refresh-merchandising', async (req, res, next) => {
  try {
    const result = await analyticsService.refreshMerchandising({
      bestSellers: req.body?.bestSellers || {},
      trending: req.body?.trending || {},
    });
    res.status(200).json({ success: true, message: 'Merchandising categories refreshed', data: result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
