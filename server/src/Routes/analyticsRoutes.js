const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../Middleware/auth');
const analyticsController = require('../controllers/analyticsController');

router.use(protect, authorize('admin'));

router.get('/revenue', analyticsController.getRevenueAnalytics);
router.get('/best-sellers', analyticsController.getBestSellers);
router.get('/customers', analyticsController.getCustomerAnalytics);
router.get('/comparison', analyticsController.getComparison);
router.get('/summary', analyticsController.getAnalyticsSummary);
router.get('/enquiries', analyticsController.getEnquiryStats);
router.get('/payments', analyticsController.getPaymentBreakdown);
router.get('/best-selling-revenue', analyticsController.getBestSellingByRevenue);

router.post('/refresh-merchandising', async (req, res, next) => {
  try {
    const analyticsService = require('../services/analyticsService');
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
