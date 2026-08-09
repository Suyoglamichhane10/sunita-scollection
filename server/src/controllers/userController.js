const User = require('../Models/User');
const Product = require('../Models/Product');
const bcrypt = require('bcrypt');

exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a user's role (admin/customer)
// @route   PUT /api/users/:id/role
// @access  Private/Admin
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!role || !['customer', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be either "customer" or "admin"',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent an admin from demoting themselves
    if (user._id.toString() === req.user.id.toString() && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own role',
      });
    }

    user.role = role;
    await user.save();

    user.password = undefined;
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('wishlist')
      .populate('cart.product');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.password = undefined;
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address, avatar } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (avatar) user.avatar = avatar;
    if (address) {
      user.address = {
        ...user.address,
        ...address,
      };
    }

    await user.save();
    user.password = undefined;

    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

exports.getWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('wishlist');
    res.status(200).json({ success: true, wishlist: user.wishlist || [] });
  } catch (error) {
    next(error);
  }
};

exports.addToWishlist = async (req, res, next) => {
  try {
    const productId = req.params.productId;
    const user = await User.findById(req.user.id);
    if (user.wishlist.includes(productId)) {
      return res.status(200).json({ success: true, message: 'Already in wishlist', wishlist: user.wishlist });
    }

    user.wishlist.push(productId);
    await user.save();
    res.status(200).json({ success: true, wishlist: user.wishlist });
  } catch (error) {
    next(error);
  }
};

exports.removeFromWishlist = async (req, res, next) => {
  try {
    const productId = req.params.productId;
    const user = await User.findById(req.user.id);
    user.wishlist = user.wishlist.filter((item) => item.toString() !== productId);
    await user.save();
    res.status(200).json({ success: true, wishlist: user.wishlist });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/users/profile/password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters',
      });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get saved addresses
// @route   GET /api/users/profile/addresses
// @access  Private
exports.getAddresses = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, addresses: user.addresses || [] });
  } catch (error) {
    next(error);
  }
};

// @desc    Add saved address
// @route   POST /api/users/profile/addresses
// @access  Private
exports.addAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const { fullName, phone, street, city, state, zipCode, country, isDefault } = req.body;

    if (!fullName || !phone || !street || !city) {
      return res.status(400).json({
        success: false,
        message: 'fullName, phone, street, and city are required',
      });
    }

    const address = {
      fullName,
      phone,
      street,
      city,
      state,
      zipCode,
      country: country || 'Nepal',
      isDefault: isDefault || user.addresses.length === 0,
    };

    if (address.isDefault) {
      user.addresses.forEach((addr) => (addr.isDefault = false));
    }

    user.addresses.push(address);
    await user.save();

    res.status(201).json({ success: true, addresses: user.addresses });
  } catch (error) {
    next(error);
  }
};

// @desc    Update saved address
// @route   PUT /api/users/profile/addresses/:addressId
// @access  Private
exports.updateAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const address = user.addresses.id(req.params.addressId);
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    const { fullName, phone, street, city, state, zipCode, country, isDefault } = req.body;
    if (fullName) address.fullName = fullName;
    if (phone) address.phone = phone;
    if (street) address.street = street;
    if (city) address.city = city;
    if (state !== undefined) address.state = state;
    if (zipCode !== undefined) address.zipCode = zipCode;
    if (country) address.country = country;

    if (isDefault) {
      user.addresses.forEach((addr) => (addr.isDefault = false));
      address.isDefault = true;
    }

    await user.save();
    res.status(200).json({ success: true, addresses: user.addresses });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete saved address
// @route   DELETE /api/users/profile/addresses/:addressId
// @access  Private
exports.deleteAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const address = user.addresses.id(req.params.addressId);
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

address.deleteOne();
    await user.save();

    res.status(200).json({ success: true, addresses: user.addresses });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my cart
// @route   GET /api/users/profile/cart
// @access  Private
exports.getCart = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('cart.product');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, cart: user.cart || [] });
  } catch (error) {
    next(error);
  }
};

// @desc    Add item to cart
// @route   POST /api/users/profile/cart
// @access  Private
exports.addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1, variantSku = null } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, message: 'productId is required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    let stock = product.stock;
    let variant = null;
    if (variantSku && product.variants && product.variants.length) {
      variant = product.variants.find(
        (v) => (v.sku && v.sku === variantSku) || (v._id && v._id.toString() === variantSku)
      );
      if (!variant) {
        return res.status(400).json({ success: false, message: 'Variant not found' });
      }
      stock = variant.stock;
    }

    if (quantity > stock) {
      return res.status(400).json({ success: false, message: `Insufficient stock (max ${stock})` });
    }

    const user = await User.findById(req.user.id);
    const existing = user.cart.find(
      (item) =>
        item.product.toString() === productId &&
        (item.variantSku || null) === (variantSku || null)
    );

    if (existing) {
      existing.quantity = Math.min(existing.quantity + quantity, stock);
    } else {
      user.cart.push({ product: productId, quantity, variantSku: variantSku || null });
    }

    await user.save();
    const populated = await User.findById(req.user.id).populate('cart.product');
    res.status(200).json({ success: true, cart: populated.cart });
  } catch (error) {
    next(error);
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/users/profile/cart/:key
// @access  Private
exports.updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
    }

    const user = await User.findById(req.user.id);
    // key format: <productId> or <productId>:<variantSku>
    const [productId, variantSku] = req.params.key.split(':');
    const item = user.cart.find(
      (c) =>
        c.product.toString() === productId &&
        (c.variantSku || null) === (variantSku || null)
    );

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not in cart' });
    }

    const product = await Product.findById(productId);
    let stock = product?.stock;
    if (variantSku && product?.variants?.length) {
      const v = product.variants.find(
        (vv) => (vv.sku && vv.sku === variantSku) || (vv._id && vv._id.toString() === variantSku)
      );
      if (v) stock = v.stock;
    }
    item.quantity = Math.min(quantity, stock || quantity);

    await user.save();
    const populated = await User.findById(req.user.id).populate('cart.product');
    res.status(200).json({ success: true, cart: populated.cart });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/users/profile/cart/:key
// @access  Private
exports.removeCartItem = async (req, res, next) => {
  try {
    const [productId, variantSku] = req.params.key.split(':');
    const user = await User.findById(req.user.id);
    user.cart = user.cart.filter(
      (c) =>
        !(c.product.toString() === productId && (c.variantSku || null) === (variantSku || null))
    );
    await user.save();
    const populated = await User.findById(req.user.id).populate('cart.product');
    res.status(200).json({ success: true, cart: populated.cart });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear cart
// @route   DELETE /api/users/profile/cart
// @access  Private
exports.clearCart = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    user.cart = [];
    await user.save();
    res.status(200).json({ success: true, cart: [] });
  } catch (error) {
    next(error);
  }
};
