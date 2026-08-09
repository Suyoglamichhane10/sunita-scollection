const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../Middleware/auth');
const {
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  getActivityLogs,
} = require('../controllers/marketingController');

// Public: validate a coupon during checkout
router.post('/coupons/validate', validateCoupon);

// Admin-only routes
router.get('/coupons', protect, authorize('admin'), getCoupons);
router.post('/coupons', protect, authorize('admin'), createCoupon);
router.put('/coupons/:id', protect, authorize('admin'), updateCoupon);
router.delete('/coupons/:id', protect, authorize('admin'), deleteCoupon);

router.get('/activity', protect, authorize('admin'), getActivityLogs);

module.exports = router;
