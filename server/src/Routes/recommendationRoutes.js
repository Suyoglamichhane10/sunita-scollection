const express = require('express');
const router = express.Router();
const { protect } = require('../Middleware/auth');
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
router.get('/trending', protect, getTrending);
router.post('/complementary', protect, getComplementary);
router.get('/recently-viewed', protect, getRecentlyViewed);
router.get('/size/:productId', protect, getSizeRecommendation);
router.post('/looks', protect, saveLook);
router.get('/looks', protect, getSavedLooks);
router.delete('/looks/:lookId', protect, deleteLook);

module.exports = router;
