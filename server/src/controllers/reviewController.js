const Review = require('../Models/Review');
const Order = require('../Models/Order');
const Product = require('../Models/Product');
const loyaltyService = require('../services/loyaltyService');

// @desc    Get reviews for a product
// @route   GET /api/reviews/product/:productId
// @access  Public
exports.getProductReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({
      product: req.params.productId,
      isApproved: true,
    })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, reviews });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a review
// @route   POST /api/reviews
// @access  Private
exports.createReview = async (req, res, next) => {
  try {
    const { product, rating, title, comment } = req.body;

    const productExists = await Product.findById(product);
    if (!productExists) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check if user already reviewed this product
    const alreadyReviewed = await Review.findOne({
      user: req.user.id,
      product,
    });
    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product',
      });
    }

    // Check verified purchase
    let isVerifiedPurchase = false;
    const order = await Order.findOne({
      user: req.user.id,
      'items.product': product,
      orderStatus: { $in: ['delivered', 'shipped'] },
    });
    if (order) isVerifiedPurchase = true;

const review = await Review.create({
      user: req.user.id,
      product,
      order: order?._id,
      rating,
      title,
      comment,
      isVerifiedPurchase,
    });

    // Award loyalty points & reviewer badge for the review (non-blocking)
    setImmediate(async () => {
      try {
        await loyaltyService.awardPoints(req.user.id, 25, 'review');
        await loyaltyService.awardBadge(req.user.id, 'reviewer');
        await loyaltyService.updateChallengeProgress(req.user.id, 'write_review');
      } catch (err) {
        console.error('Review loyalty error:', err.message);
      }
    });

    res.status(201).json({ success: true, review });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark review as helpful
// @route   PUT /api/reviews/:id/helpful
// @access  Private
exports.markHelpful = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    if (review.helpful.users.includes(req.user.id)) {
      return res.status(400).json({ success: false, message: 'Already marked as helpful' });
    }

    review.helpful.users.push(req.user.id);
    review.helpful.count = review.helpful.users.length;
    await review.save();

    res.status(200).json({ success: true, review });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviews (admin)
// @route   GET /api/reviews
// @access  Private/Admin
exports.getReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find()
      .populate('user', 'name email')
      .populate('product', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, reviews });
  } catch (error) {
    next(error);
  }
};

// @desc    Moderate review (approve/reject) - admin
// @route   PUT /api/reviews/:id/moderate
// @access  Private/Admin
exports.moderateReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    const { isApproved } = req.body;
    review.isApproved = isApproved !== undefined ? isApproved : review.isApproved;
    await review.save();

    res.status(200).json({ success: true, review });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete review - admin
// @route   DELETE /api/reviews/:id
// @access  Private/Admin
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    await review.deleteOne();
    res.status(200).json({ success: true, message: 'Review deleted' });
  } catch (error) {
    next(error);
  }
};
