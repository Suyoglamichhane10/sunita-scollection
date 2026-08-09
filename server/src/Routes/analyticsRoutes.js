const express = require('express');
const router = express.Router();
const {
  getRevenueAnalytics,
  getBestSellers,
  getCustomerAnalytics,
  getComparison,
  getAnalyticsSummary,
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../Middleware/auth');

// All analytics routes are admin-only
router.use(protect, authorize('admin'));

router.get('/revenue', getRevenueAnalytics);
router.get('/best-sellers', getBestSellers);
router.get('/customers', getCustomerAnalytics);
router.get('/comparison', getComparison);
router.get('/summary', getAnalyticsSummary);

module.exports = router;
