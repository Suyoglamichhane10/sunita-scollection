const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../Middleware/auth');
const {
  getLoyalty,
  spinWheel,
  checkBirthday,
  redeemReward,
  getReferral,
  submitReferral,
  getAnalytics,
} = require('../controllers/loyaltyController');

router.get('/', protect, getLoyalty);
router.post('/spin', protect, spinWheel);
router.post('/birthday', protect, checkBirthday);
router.post('/redeem', protect, redeemReward);
router.get('/referral', protect, getReferral);
router.post('/referral', protect, submitReferral);
router.get('/analytics', protect, authorize('admin'), getAnalytics);

module.exports = router;
