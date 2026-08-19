const Product = require('../Models/Product');
const Category = require('../Models/Category');
const { decrementStock, restoreStock } = require('../services/stockService');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    
    let query = { isActive: true, stock: { $gt: 0 } };

    // Search
    if (req.query.search) {
      const searchTerm = req.query.search.trim();
      if (searchTerm) {
        const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchRegex = new RegExp(escaped, 'i');
        query.$or = [
          { name: searchRegex },
          { description: searchRegex },
          { brand: searchRegex },
        ];
      }
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

// @desc    Get all products for admin panel (active + inactive)
// @route   GET /api/products/admin
// @access  Private/Admin
exports.adminGetProducts = async (req, res, next) => {
  try {
    const products = await Product.find()
      .populate('category')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      products,
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

// @desc    Soft delete product (marks as inactive)
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

    // Soft delete - mark as inactive instead of removing from database
    product.isActive = false;
    product.isFeatured = false; // Also remove from featured
    await product.save();

    // Update category product count
    await Category.findByIdAndUpdate(product.category, {
      $inc: { productCount: -1 },
    });

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle product active status
// @route   PUT /api/products/:id/toggle-status
// @access  Private/Admin
exports.toggleProductStatus = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    product.isActive = !product.isActive;
    await product.save();

    res.status(200).json({
      success: true,
      message: product.isActive ? 'Product is now visible' : 'Product is now hidden',
      product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle product featured status
// @route   PUT /api/products/:id/toggle-featured
// @access  Private/Admin
exports.toggleFeaturedStatus = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    product.isFeatured = !product.isFeatured;
    await product.save();

    res.status(200).json({
      success: true,
      message: product.isFeatured ? 'Product added to featured' : 'Product removed from featured',
      product,
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
      const threshold = product.lowStockThreshold || 5;
      const lowBaseStock = product.stock <= threshold;
      const lowVariants = (product.variants || []).filter((variant) => variant.stock <= threshold);

      return {
        ...product.toObject(),
        inventoryStatus: lowBaseStock || lowVariants.length ? 'low' : 'healthy',
        lowVariantCount: lowVariants.length,
        isLowStock: lowBaseStock,
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

// @desc    Update product stock manually
// @route   PUT /api/products/:id/stock
// @access  Private/Admin
exports.updateProductStock = async (req, res, next) => {
  try {
    const { stock } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    if (stock < 0) {
      return res.status(400).json({
        success: false,
        message: 'Stock cannot be negative',
      });
    }

    product.stock = stock;
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Stock updated successfully',
      product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk update product stock
// @route   PUT /api/products/bulk/stock
// @access  Private/Admin
exports.bulkUpdateStock = async (req, res, next) => {
  try {
    const { updates } = req.body; // Array of { productId, stock }

    if (!Array.isArray(updates)) {
      return res.status(400).json({
        success: false,
        message: 'Updates must be an array',
      });
    }

    const results = await Promise.all(
      updates.map(async (update) => {
        const product = await Product.findById(update.productId);
        if (!product) return null;

        product.stock = Math.max(0, update.stock);
        await product.save();
        return product;
      })
    );

    const successful = results.filter((r) => r !== null);

    res.status(200).json({
      success: true,
      message: `Updated ${successful.length} products`,
      products: successful,
    });
  } catch (error) {
    next(error);
  }
};