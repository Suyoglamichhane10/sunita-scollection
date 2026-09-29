const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../Middleware/auth');
const {
  trackView,
  getRecommendedForYou,
  getTrending,
  getComplementary,
  getRecentlyViewed,
  getSizeRecommendation,
  saveLook,
  getSavedLooks,
  deleteLook,
} = require('../controllers/recommendationController');

router.post('/view', protect, trackView);
router.get('/recommended', protect, getRecommendedForYou);
router.get('/trending', optionalAuth, getTrending);
router.post('/complementary', optionalAuth, getComplementary);
router.get('/recently-viewed', protect, getRecentlyViewed);
router.get('/size/:productId', protect, getSizeRecommendation);
router.post('/looks', protect, saveLook);
router.get('/looks', protect, getSavedLooks);
router.delete('/looks/:lookId', protect, deleteLook);

module.exports = router;
