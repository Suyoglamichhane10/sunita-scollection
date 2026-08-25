const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a product name'],
      trim: true,
      maxlength: [100, 'Name cannot be more than 100 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
      maxlength: [2000, 'Description cannot be more than 2000 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Please add a price'],
      min: [0, 'Price cannot be negative'],
    },
    comparePrice: {
      type: Number,
      min: [0, 'Compare price cannot be negative'],
    },
    costPrice: {
      type: Number,
      min: [0, 'Cost price cannot be negative'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Please add a category'],
    },
    brand: {
      type: String,
      trim: true,
    },
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        publicId: String,
        isMain: {
          type: Boolean,
          default: false,
        },
      },
    ],
    variants: [
      {
        sku: { type: String, trim: true },
        title: { type: String, trim: true },
        attributes: {
          // e.g. { color: 'Red', size: 'M' }
          type: Map,
          of: String,
        },
        price: { type: Number, min: 0 },
        stock: { type: Number, default: 0, min: 0 },
        images: [
          {
            url: { type: String },
            publicId: String,
            isMain: { type: Boolean, default: false },
          },
        ],
      },
    ],
    stock: {
      type: Number,
      required: [true, 'Please add stock quantity'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
    },
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    specifications: {
      type: Map,
      of: String,
    },
    tags: [String],
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
    },
    metaTitle: String,
    metaDescription: String,
    views: {
      type: Number,
      default: 0,
    },
    soldCount: {
      type: Number,
      default: 0,
    },
    trendingScore: {
      type: Number,
      default: 0,
    },
    // === Admin-controlled homepage merchandising categories ===
    isNewArrival: {
      type: Boolean,
      default: false,
    },
    isBestSeller: {
      type: Boolean,
      default: false,
    },
    isTrending: {
      type: Boolean,
      default: false,
    },
    isRecommended: {
      type: Boolean,
      default: false,
    },
    // Manual ordering within a featured category (lower shows first)
    featuredOrder: {
      type: Number,
      default: 0,
    },
    // Date range the product should appear as a "New Arrival"
    newArrivalStart: {
      type: Date,
      default: null,
    },
    newArrivalEnd: {
      type: Date,
      default: null,
    },
    // Populated by analyticsService; customer segment keys this product is
    // manually assigned to for "Recommended For You" (e.g. ['new-moms', 'trendsetters'])
    recommendedSegments: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Create text index for search functionality
productSchema.index({ name: 'text', description: 'text', brand: 'text', category: 'text' });
productSchema.index({ isActive: 1, createdAt: -1 });
productSchema.index({ isFeatured: 1, createdAt: -1 });
productSchema.index({ soldCount: -1 });
productSchema.index({ trendingScore: -1, views: -1 });
productSchema.index({ isNewArrival: 1, featuredOrder: 1 });
productSchema.index({ isBestSeller: 1, featuredOrder: 1 });
productSchema.index({ isTrending: 1, featuredOrder: 1 });
productSchema.index({ isRecommended: 1, featuredOrder: 1 });

// Create slug before saving
productSchema.pre('save', async function (next) {
  if (this.isModified('name')) {
    const baseSlug = this.name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    // Ensure the slug is unique by appending a counter (+1, +2, ...) if needed.
    let slug = baseSlug || 'product';
    const Product = this.constructor;
    let count = 0;
    // If this is an existing document, ignore itself when checking uniqueness.
    const excludeId = this._id;
    while (await Product.exists({ slug, _id: { $ne: excludeId } })) {
      count += 1;
      slug = `${baseSlug || 'product'}-${count}`;
    }
    this.slug = slug;
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
