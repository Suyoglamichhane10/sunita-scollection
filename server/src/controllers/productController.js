const Product = require('../Models/Product');
const Category = require('../Models/Category');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    
    let query = { isActive: true };

    // Search
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    // Category filter
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Price filter
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = parseInt(req.query.minPrice);
      if (req.query.maxPrice) query.price.$lte = parseInt(req.query.maxPrice);
    }

    // Featured filter
    if (req.query.featured === 'true') {
      query.isFeatured = true;
    }

    // Sort
    let sort = {};
    if (req.query.sort) {
      switch (req.query.sort) {
        case 'price-low':
          sort = { price: 1 };
          break;
        case 'price-high':
          sort = { price: -1 };
          break;
        case 'rating':
          sort = { 'rating.average': -1 };
          break;
        case 'newest':
          sort = { createdAt: -1 };
          break;
        case 'popular':
          sort = { views: -1 };
          break;
        default:
          sort = { createdAt: -1 };
      }
    }

    const products = await Product.find(query)
      .populate('category')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Increment views
    product.views += 1;
    await product.save();

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = async (req, res, next) => {
  try {
    // Sanitize incoming product data so empty/undefined fields don't trigger
    // validation errors or cast issues.
    const images = (req.body.images || []).filter((img) => img && img.url);
    const variants = (req.body.variants || [])
      .filter((v) => v && (v.title || (v.attributes && v.attributes.color)))
      .map((v) => ({
        title: v.title || (v.attributes && v.attributes.color) || 'Variant',
        attributes: { color: (v.attributes && v.attributes.color) || 'Default' },
        sku: v.sku || undefined,
        price: v.price || undefined,
        stock: Number(v.stock) || 0,
        images: (v.images || []).filter((img) => img && img.url),
      }));

    const payload = {
      ...req.body,
      images,
      variants,
    };

    const product = await Product.create(payload);

    // Update category product count
    await Category.findByIdAndUpdate(req.body.category, {
      $inc: { productCount: 1 },
    });

    res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

// If category is changing, update counts
    if (req.body.category && req.body.category !== product.category.toString()) {
      await Category.findByIdAndUpdate(product.category, {
        $inc: { productCount: -1 },
      });
      await Category.findByIdAndUpdate(req.body.category, {
        $inc: { productCount: 1 },
      });
    }

    // Sanitize variants/images (same as create) so editing doesn't error.
    const updatePayload = { ...req.body };
    if (Array.isArray(updatePayload.images)) {
      updatePayload.images = updatePayload.images.filter((img) => img && img.url);
    }
    if (Array.isArray(updatePayload.variants)) {
      updatePayload.variants = updatePayload.variants
        .filter((v) => v && (v.title || (v.attributes && v.attributes.color)))
        .map((v) => ({
          title: v.title || (v.attributes && v.attributes.color) || 'Variant',
          attributes: { color: (v.attributes && v.attributes.color) || 'Default' },
          sku: v.sku || undefined,
          price: v.price || undefined,
          stock: Number(v.stock) || 0,
          images: (v.images || []).filter((img) => img && img.url),
        }));
    }

    product = await Product.findByIdAndUpdate(req.params.id, updatePayload, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Update category product count
    await Category.findByIdAndUpdate(product.category, {
      $inc: { productCount: -1 },
    });

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get inventory with low-stock indicators
// @route   GET /api/products/inventory
// @access  Private/Admin
exports.getInventory = async (req, res, next) => {
  try {
    const products = await Product.find()
      .populate('category', 'name')
      .sort({ updatedAt: -1 });

    const inventory = products.map((product) => {
      const threshold = product.lowStockThreshold || 0;
      const lowBaseStock = product.stock <= threshold;
      const lowVariants = (product.variants || []).filter((variant) => variant.stock <= threshold);

      return {
        ...product.toObject(),
        inventoryStatus: lowBaseStock || lowVariants.length ? 'low' : 'healthy',
        lowVariantCount: lowVariants.length,
      };
    });

    res.status(200).json({
      success: true,
      inventory,
      lowStockCount: inventory.filter((product) => product.inventoryStatus === 'low').length,
    });
  } catch (error) {
    next(error);
  }
};
