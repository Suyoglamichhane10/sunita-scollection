const Wishlist = require('../Models/Wishlist');
const Product = require('../Models/Product');

// @desc    Get user wishlist
// @route   GET /api/wishlist
// @access  Private
exports.getWishlist = async (req, res, next) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user.id }).populate('items.product', 'name price images stock variants');
    res.status(200).json({ success: true, wishlist: wishlist || { items: [] } });
  } catch (error) {
    next(error);
  }
};

// @desc    Add item to wishlist
// @route   POST /api/wishlist
// @access  Private
exports.addToWishlist = async (req, res, next) => {
  try {
    const { productId, variantSku } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    let wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user.id, items: [] });
    }

    const existingIndex = wishlist.items.findIndex(
      (item) => item.product.toString() === productId && item.variantSku === variantSku
    );

    if (existingIndex >= 0) {
      return res.status(200).json({ success: true, wishlist, message: 'Already in wishlist' });
    }

    wishlist.items.push({ product: productId, variantSku: variantSku || null });
    await wishlist.save();

    const populated = await Wishlist.findById(wishlist._id).populate('items.product', 'name price images stock variants');
    res.status(201).json({ success: true, wishlist: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove item from wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private
exports.removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { variantSku } = req.query;

    const wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) {
      return res.status(404).json({ success: false, message: 'Wishlist not found' });
    }

    wishlist.items = wishlist.items.filter(
      (item) => !(item.product.toString() === productId && item.variantSku === variantSku)
    );
    await wishlist.save();

    const populated = await Wishlist.findById(wishlist._id).populate('items.product', 'name price images stock variants');
    res.status(200).json({ success: true, wishlist: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear wishlist
// @route   DELETE /api/wishlist
// @access  Private
exports.clearWishlist = async (req, res, next) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) {
      return res.status(200).json({ success: true, wishlist: { items: [] } });
    }

    wishlist.items = [];
    await wishlist.save();
    res.status(200).json({ success: true, wishlist: { items: [] } });
  } catch (error) {
    next(error);
  }
};
