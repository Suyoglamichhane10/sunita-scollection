const mongoose = require('mongoose');

const productViewSchema = new mongoose.Schema(
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
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
    viewedAt: { type: Date, default: Date.now },
    timeSpent: { type: Number, default: 0 }, // seconds
    source: {
      type: String,
      enum: ['search', 'category', 'recommended', 'home', 'direct'],
      default: 'direct',
    },
  },
  {
    timestamps: true,
  }
);

productViewSchema.index({ user: 1, viewedAt: -1 });
productViewSchema.index({ user: 1, product: 1 });

module.exports = mongoose.model('ProductView', productViewSchema);
