const Product = require('../Models/Product');
const Category = require('../Models/Category');
const ProductView = require('../Models/ProductView');
const User = require('../Models/User');
const { decrementStock, restoreStock } = require('../services/stockService');

// @desc    Get all products (public)
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
    console.error('getProducts error:', error);
    next(error);
  }
};

// @desc    Get homepage product sections
// @route   GET /api/products/home/sections
// @access  Public
exports.getHomeSections = async (req, res, next) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [newArrivals, featured, bestSellers, trending] = await Promise.all([
      Product.find({ isActive: true, createdAt: { $gte: sevenDaysAgo } })
        .populate('category')
        .sort({ createdAt: -1 })
        .limit(8),
      Product.find({ isActive: true, isFeatured: true })
        .populate('category')
        .sort({ createdAt: -1 })
        .limit(8),
      Product.find({ isActive: true, soldCount: { $gt: 0 } })
        .populate('category')
        .sort({ soldCount: -1 })
        .limit(8),
      Product.find({ isActive: true })
        .populate('category')
        .sort({ trendingScore: -1, views: -1, createdAt: -1 })
        .limit(8),
    ]);

    res.status(200).json({
      success: true,
      sections: {
        newArrivals,
        featured,
        bestSellers,
        trending,
      },
    });
  } catch (error) {
    console.error('getHomeSections error:', error);
    next(error);
  }
};

// @desc    Get products grouped by brand
// @route   GET /api/products/groups/brands
// @access  Public
exports.getProductsByBrand = async (req, res, next) => {
  try {
    const products = await Product.find({ isActive: true, brand: { $exists: true, $ne: '' } })
      .populate('category')
      .sort({ brand: 1, createdAt: -1 });

    const grouped = products.reduce((acc, product) => {
      const brand = product.brand || 'Other';
      if (!acc[brand]) acc[brand] = [];
      acc[brand].push(product);
      return acc;
    }, {});

    res.status(200).json({ success: true, groups: grouped });
  } catch (error) {
    console.error('getProductsByBrand error:', error);
    next(error);
  }
};

// @desc    Get products grouped by color
// @route   GET /api/products/groups/colors
// @access  Public
exports.getProductsByColor = async (req, res, next) => {
  try {
    const products = await Product.find({ isActive: true })
      .populate('category')
      .sort({ createdAt: -1 });

    const colorMap = {};
    products.forEach((product) => {
      const colors = (product.variants || [])
        .map((v) => v.attributes?.color || v.title)
        .filter(Boolean);
      const uniqueColors = [...new Set(colors)];
      uniqueColors.forEach((color) => {
        const key = color.toLowerCase();
        if (!colorMap[key]) colorMap[key] = { color, products: [] };
        if (!colorMap[key].products.find((p) => p._id.toString() === product._id.toString())) {
          colorMap[key].products.push(product);
        }
      });
    });

    const groups = Object.values(colorMap).sort((a, b) => a.color.localeCompare(b.color));

    res.status(200).json({ success: true, groups });
  } catch (error) {
    console.error('getProductsByColor error:', error);
    next(error);
  }
};

exports.getSuggestions = async (req, res, next) => {
  try {
    const searchTerm = (req.query.q || req.query.search || '').trim();
    const limit = parseInt(req.query.limit) || 8;

    if (!searchTerm) {
      return res.status(200).json({ success: true, suggestions: [] });
    }

    const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(escaped, 'i');

    const query = { isActive: true };
    query.$or = [
      { name: searchRegex },
      { brand: searchRegex },
      { tags: searchRegex },
    ];

    const products = await Product.find(query)
      .populate('category', 'name')
      .select('name price images category brand')
      .sort({ views: -1, createdAt: -1 })
      .limit(limit);

    const suggestions = products.map((p) => ({
      id: p._id,
      type: 'product',
      name: p.name,
      image: p.images?.[0]?.url || null,
      price: p.price,
      category: p.category?.name || '',
    }));

    res.status(200).json({ success: true, suggestions });
  } catch (error) {
    console.error('getSuggestions error:', error);
    next(error);
  }
};

// @desc    Get related products by category
// @route   GET /api/products/related/:productId
// @access  Public
exports.getRelatedProducts = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const related = await Product.find({
      _id: { $ne: product._id },
      category: product.category,
      isActive: true,
    })
      .populate('category')
      .sort({ createdAt: -1 })
      .limit(8);

    res.status(200).json({ success: true, products: related });
  } catch (error) {
    console.error('getRelatedProducts error:', error);
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
    console.error('getProduct error:', error);
    next(error);
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = async (req, res, next) => {
  try {
    const images = (req.body.images || []).filter((img) => img && img.url);
    const variants = (req.body.variants || [])
      .filter((v) => v && (v.title || (v.attributes && v.attributes.color)))
      .map((v, idx) => {
        const title = v.title || (v.attributes && v.attributes.color) || 'Variant';
        const sku = v.sku && v.sku.trim()
          ? v.sku.trim()
          : `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${idx + 1}-${Date.now()}`;
        return {
          title,
          attributes: { color: (v.attributes && v.attributes.color) || 'Default' },
          sku,
          price: v.price ? Number(v.price) : undefined,
          stock: Number(v.stock) || 0,
          images: (v.images || []).filter((img) => img && img.url),
        };
      });

    const payload = {
      ...req.body,
      images,
      variants,
      trendingScore: 0,
    };

    const product = await Product.create(payload);

    await Category.findByIdAndUpdate(req.body.category, {
      $inc: { productCount: 1 },
    });

    res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error('createProduct error:', error);
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
    console.error('adminGetProducts error:', error);
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

    if (req.body.category && req.body.category !== product.category.toString()) {
      await Category.findByIdAndUpdate(product.category, {
        $inc: { productCount: -1 },
      });
      await Category.findByIdAndUpdate(req.body.category, {
        $inc: { productCount: 1 },
      });
    }

    const updatePayload = { ...req.body };
    if (Array.isArray(updatePayload.images)) {
      updatePayload.images = updatePayload.images.filter((img) => img && img.url);
    }
    if (Array.isArray(updatePayload.variants)) {
      updatePayload.variants = updatePayload.variants
        .filter((v) => v && (v.title || (v.attributes && v.attributes.color)))
        .map((v, idx) => {
          const title = v.title || (v.attributes && v.attributes.color) || 'Variant';
          const sku = v.sku && v.sku.trim()
            ? v.sku.trim()
            : `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${idx + 1}-${Date.now()}`;
          return {
            title,
            attributes: { color: (v.attributes && v.attributes.color) || 'Default' },
            sku,
            price: v.price ? Number(v.price) : undefined,
            stock: Number(v.stock) || 0,
            images: (v.images || []).filter((img) => img && img.url),
          };
        });
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
    console.error('updateProduct error:', error);
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

    product.isActive = false;
    product.isFeatured = false;
    await product.save();

    await Category.findByIdAndUpdate(product.category, {
      $inc: { productCount: -1 },
    });

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('deleteProduct error:', error);
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
    console.error('toggleProductStatus error:', error);
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
    console.error('toggleFeaturedStatus error:', error);
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
    console.error('getInventory error:', error);
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
    console.error('updateProductStock error:', error);
    next(error);
  }
};

// @desc    Bulk update product stock
// @route   PUT /api/products/bulk/stock
// @access  Private/Admin
exports.bulkUpdateStock = async (req, res, next) => {
  try {
    const { updates } = req.body;

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
    console.error('bulkUpdateStock error:', error);
    next(error);
  }
};

// @desc    Get products assigned to a homepage merchandising category
// @route   GET /api/products/featured?type=newArrivals|bestsellers|trending|recommended
// @access  Public
exports.getProductsByFeaturedCategory = async (req, res, next) => {
  try {
    const type = (req.query.type || 'newArrivals').toLowerCase();
    const allowed = ['newarrivals', 'bestsellers', 'trending', 'recommended'];
    if (!allowed.includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid featured category type' });
    }

    const limit = parseInt(req.query.limit, 10) || 8;
    const now = new Date();
    const baseQuery = { isActive: true };

    if (type === 'newarrivals') {
      baseQuery.isNewArrival = true;
      baseQuery.$and = [
        { $or: [{ newArrivalStart: null }, { newArrivalStart: { $lte: now } }] },
        { $or: [{ newArrivalEnd: null }, { newArrivalEnd: { $gte: now } }] },
      ];
    } else if (type === 'bestsellers') {
      baseQuery.isBestSeller = true;
    } else if (type === 'trending') {
      baseQuery.isTrending = true;
    } else if (type === 'recommended') {
      baseQuery.isRecommended = true;
    }

    const sort = type === 'trending'
      ? { featuredOrder: 1, trendingScore: -1, views: -1 }
      : type === 'bestsellers'
        ? { featuredOrder: 1, soldCount: -1 }
        : { featuredOrder: 1, createdAt: -1 };

    let products = await Product.find(baseQuery)
      .populate('category')
      .sort(sort)
      .limit(limit);

    // Fallback: if the admin has not explicitly flagged any products for this
    // category yet, derive a sensible list automatically so the homepage
    // section is never empty. Manually flagged items always take precedence.
    if (!products.length) {
      if (type === 'newarrivals') {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        products = await Product.find({ isActive: true, createdAt: { $gte: sevenDaysAgo } })
          .populate('category')
          .sort({ createdAt: -1 })
          .limit(limit);
      } else if (type === 'bestsellers') {
        products = await Product.find({ isActive: true, soldCount: { $gt: 0 } })
          .populate('category')
          .sort({ soldCount: -1 })
          .limit(limit);
      } else if (type === 'trending') {
        products = await Product.find({ isActive: true })
          .populate('category')
          .sort({ trendingScore: -1, views: -1, createdAt: -1 })
          .limit(limit);
      }
    }

    res.status(200).json({ success: true, products, type });
  } catch (error) {
    console.error('getProductsByFeaturedCategory error:', error);
    next(error);
  }
};

// @desc    Update a product's homepage category assignments
// @route   PUT /api/products/:id/categories
// @access  Private/Admin
exports.updateProductCategories = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const fields = [
      'isNewArrival',
      'isBestSeller',
      'isTrending',
      'isRecommended',
      'featuredOrder',
      'newArrivalStart',
      'newArrivalEnd',
    ];

    const update = {};
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if ((field === 'newArrivalStart' || field === 'newArrivalEnd') && req.body[field]) {
          update[field] = new Date(req.body[field]);
        } else {
          update[field] = req.body[field];
        }
      }
    });

    if (req.body.recommendedSegments !== undefined && Array.isArray(req.body.recommendedSegments)) {
      update.recommendedSegments = req.body.recommendedSegments.map((s) => String(s).trim()).filter(Boolean);
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });

    res.status(200).json({ success: true, product: updated, message: 'Product categories updated' });
  } catch (error) {
    console.error('updateProductCategories error:', error);
    next(error);
  }
};

// @desc    Reorder products within a featured category (drag-and-drop)
// @route   PUT /api/products/featured/reorder
// @access  Private/Admin
exports.reorderFeaturedProducts = async (req, res, next) => {
  try {
    const { ordered } = req.body;
    if (!Array.isArray(ordered)) {
      return res.status(400).json({ success: false, message: 'ordered must be an array' });
    }

    const bulkOps = ordered
      .filter((item) => item && item.id)
      .map((item) => ({
        updateOne: {
          filter: { _id: item.id },
          update: { featuredOrder: Number(item.order) || 0 },
        },
      }));

    if (!bulkOps.length) {
      return res.status(400).json({ success: false, message: 'No valid order items provided' });
    }

    await Product.bulkWrite(bulkOps);

    res.status(200).json({ success: true, message: `Reordered ${bulkOps.length} products` });
  } catch (error) {
    console.error('reorderFeaturedProducts error:', error);
    next(error);
  }
};

// @desc    Track a product view (used for trending + recently viewed)
// @route   POST /api/products/:id/view
// @access  Public (records user when authenticated)
exports.trackProductView = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Bump raw views and trending weight.
    await Product.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1, trendingScore: 1 } },
      { new: false }
    );

    // If the request is authenticated, persist a browsable view record.
    if (req.user && req.user.id) {
      await ProductView.create({
        user: req.user.id,
        product: req.params.id,
        category: product.category,
        source: req.body?.source || 'direct',
        timeSpent: req.body?.timeSpent || 0,
      });

      await User.findByIdAndUpdate(req.user.id, {
        $pull: { recentlyViewed: { product: req.params.id } },
      });
      const user = await User.findByIdAndUpdate(
        req.user.id,
        { $push: { recentlyViewed: { product: req.params.id, viewedAt: Date.now() } } },
        { new: true }
      );
      if (user.recentlyViewed.length > 12) {
        user.recentlyViewed = user.recentlyViewed.slice(-12);
        await user.save();
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('trackProductView error:', error);
    next(error);
  }
};
