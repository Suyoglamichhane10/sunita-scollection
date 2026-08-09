const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    rating: {
      type: Number,
      required: [true, 'Please add a rating'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot be more than 5'],
    },
    title: {
      type: String,
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    comment: {
      type: String,
      required: [true, 'Please add a comment'],
      maxlength: [1000, 'Comment cannot be more than 1000 characters'],
    },
    images: [
      {
        url: String,
        publicId: String,
      },
    ],
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },
    helpful: {
      count: {
        type: Number,
        default: 0,
      },
      users: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      ],
    },
    isApproved: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

reviewSchema.post('save', async function () {
  const Product = mongoose.model('Product');
  const product = await Product.findById(this.product);
  
  if (product) {
    const Review = mongoose.model('Review');
    const stats = await Review.aggregate([
      { $match: { product: this.product, isApproved: true } },
      { $group: {
        _id: '$product',
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 }
      }}
    ]);
    
    if (stats.length > 0) {
      product.rating.average = stats[0].avgRating;
      product.rating.count = stats[0].count;
    } else {
      product.rating.average = 0;
      product.rating.count = 0;
    }
    await product.save();
  }
});

module.exports = mongoose.model('Review', reviewSchema);