const express = require('express');
const router = express.Router();
const {
  getProductReviews,
  createReview,
  markHelpful,
  getReviews,
  moderateReview,
  deleteReview,
} = require('../controllers/reviewController');
const { protect, authorize } = require('../Middleware/auth');

// Public routes
router.get('/product/:productId', getProductReviews);

// Protected routes
router.post('/', protect, createReview);
router.put('/:id/helpful', protect, markHelpful);

// Admin routes
router.get('/', protect, authorize('admin'), getReviews);
router.put('/:id/moderate', protect, authorize('admin'), moderateReview);
router.delete('/:id', protect, authorize('admin'), deleteReview);

module.exports = router;
