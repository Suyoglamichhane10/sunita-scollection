const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
code: {
      type: String,
      required: [true, 'Please add a coupon code'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    // (unique: true already creates an index on `code`; no extra schema.index needed)
    description: { type: String, trim: true },
    // 'percentage' or 'fixed'
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
    },
    value: {
      type: Number,
      required: [true, 'Please add a coupon value'],
      min: [0, 'Value cannot be negative'],
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: [0, 'Minimum order amount cannot be negative'],
    },
    maxDiscount: {
      type: Number,
      default: 0, // 0 = unlimited cap
      min: [0, 'Max discount cannot be negative'],
    },
    // Usage limits
    usageLimit: {
      type: Number,
      default: 0, // 0 = unlimited
      min: [0, 'Usage limit cannot be negative'],
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    perUserLimit: {
      type: Number,
      default: 1,
      min: [1, 'Per-user limit must be at least 1'],
    },
    usersUsed: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        count: { type: Number, default: 0 },
      },
    ],
    // Validity window
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    // Applicable categories/products (empty = all)
    applicableCategories: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    ],
    applicableProducts: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    ],
    // Flash-sale / bundle metadata (for marketing UI)
    isFlashSale: { type: Boolean, default: false },
    flashSaleEndsAt: { type: Date },
    isBundle: { type: Boolean, default: false },
    bundleProducts: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: { type: Number, default: 1 },
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

couponSchema.index({ isActive: 1, endDate: 1 });

module.exports = mongoose.model('Coupon', couponSchema);
