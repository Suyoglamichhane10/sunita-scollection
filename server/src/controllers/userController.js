const User = require('../Models/User');
const Product = require('../Models/Product');
const Order = require('../Models/Order');
const Review = require('../Models/Review');
const Conversation = require('../Models/Conversation');
const Message = require('../Models/Message');
const Gamification = require('../Models/Gamification');
const bcrypt = require('bcrypt');
const path = require('path');
const cloudinary = require('../config/cloudinary');

// Helper: delete Cloudinary image by publicId (ignore local/null ids)
const deleteCloudinaryImage = async (publicId) => {
  if (!publicId || publicId === 'default-avatar' || publicId.startsWith('http')) {
    return;
  }
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.warn('Failed to delete Cloudinary image:', err.message);
  }
};

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

// @desc    Delete a user (admin) - cascades to their related data
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent an admin from deleting themselves
    if (user._id.toString() === req.user.id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }

    // Cascade delete related data for this user
    const userId = user._id;

    // Conversations where user is a participant or the customer
    const conversations = await Conversation.find({
      $or: [{ participants: userId }, { customer: userId }],
    });
    const conversationIds = conversations.map((c) => c._id);

    if (conversationIds.length) {
      await Message.deleteMany({ conversation: { $in: conversationIds } });
    }
    // Standalone messages submitted by the user (contact-us style)
    await Message.deleteMany({ user: userId });
    await Message.deleteMany({ sender: userId });

    await Conversation.deleteMany({
      $or: [{ participants: userId }, { customer: userId }],
    });

    // Orders placed by the user
    await Order.deleteMany({ user: userId });

    // Reviews written by the user
    const reviews = await Review.find({ user: userId }).select('product');
    await Review.deleteMany({ user: userId });
    // Recompute product ratings after review removal
    for (const r of reviews) {
      if (r.product) {
        const ProductModel = require('../Models/Product');
        const stats = await Review.aggregate([
          { $match: { product: r.product, isApproved: true } },
          { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
        ]);
        await ProductModel.findByIdAndUpdate(r.product, {
          'rating.average': stats.length ? stats[0].avgRating : 0,
          'rating.count': stats.length ? stats[0].count : 0,
        });
      }
    }

    // Loyalty profile
    if (user.loyalty) {
      await Gamification.findByIdAndDelete(user.loyalty);
    }

    await user.deleteOne();

    res.status(200).json({ success: true, message: 'User deleted successfully' });
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

// @desc    Delete own avatar
// @route   DELETE /api/users/avatar
// @access  Private
exports.deleteAvatar = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await deleteCloudinaryImage(user.avatarPublicId);

    user.avatar = 'default-avatar.png';
    user.avatarPublicId = '';
    await user.save();

    user.password = undefined;
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload own avatar
// @route   POST /api/users/avatar
// @access  Private
exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No avatar uploaded' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await deleteCloudinaryImage(user.avatarPublicId);

    const isConfigured = Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );

    let avatarUrl;
    let publicId;

    if (!isConfigured) {
      avatarUrl = `/uploads/${path.basename(req.file.path)}`;
      publicId = null;
    } else {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'sunitas-collection/avatars',
          use_filename: true,
          resource_type: 'auto',
          transformation: [{ width: 400, height: 400, crop: 'limit', gravity: 'face' }],
        });
        avatarUrl = result.secure_url;
        publicId = result.public_id;
      } catch (cloudinaryError) {
        console.warn('⚠️ Avatar Cloudinary upload failed, falling back to local storage:', cloudinaryError.message);
        avatarUrl = `/uploads/${path.basename(req.file.path)}`;
        publicId = null;
      }
    }

    user.avatar = avatarUrl;
    user.avatarPublicId = publicId || '';
    await user.save();

    user.password = undefined;
    res.status(200).json({ success: true, avatar: avatarUrl, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin upload avatar for a user
// @route   POST /api/users/:id/avatar
// @access  Private/Admin
exports.uploadUserAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No avatar uploaded' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await deleteCloudinaryImage(user.avatarPublicId);

    const isConfigured = Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );

    let avatarUrl;
    let publicId;

    if (!isConfigured) {
      avatarUrl = `/uploads/${path.basename(req.file.path)}`;
      publicId = null;
    } else {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'sunitas-collection/avatars',
          use_filename: true,
          resource_type: 'auto',
          transformation: [{ width: 400, height: 400, crop: 'limit', gravity: 'face' }],
        });
        avatarUrl = result.secure_url;
        publicId = result.public_id;
      } catch (cloudinaryError) {
        console.warn('⚠️ Avatar Cloudinary upload failed, falling back to local storage:', cloudinaryError.message);
        avatarUrl = `/uploads/${path.basename(req.file.path)}`;
        publicId = null;
      }
    }

    user.avatar = avatarUrl;
    user.avatarPublicId = publicId || '';
    await user.save();

    user.password = undefined;
    res.status(200).json({ success: true, avatar: avatarUrl, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin delete avatar for a user
// @route   DELETE /api/users/:id/avatar
// @access  Private/Admin
exports.deleteUserAvatar = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await deleteCloudinaryImage(user.avatarPublicId);

    user.avatar = 'default-avatar.png';
    user.avatarPublicId = '';
    await user.save();

    user.password = undefined;
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user avatar URL
// @route   GET /api/users/:id/avatar
// @access  Public
exports.getUserAvatar = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('avatar avatarPublicId name');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, avatar: user.avatar, name: user.name });
  } catch (error) {
    next(error);
  }
};
// (variantSku may refer to either the variant's SKU or its _id).
const cartItemHas = (cartItem, productId, variantSku) => {
  const itemVariant = cartItem.variantSku || null;
  const targetVariant = variantSku || null;
  if (cartItem.product.toString() !== productId) return false;
  if (itemVariant === targetVariant) return true;
  // If both are "empty", they match (base product).
  if (!itemVariant && !targetVariant) return true;
  return false;
};

// Helper: consolidate the user's cart array by merging duplicate
// product + variant rows (summing quantities). This runs before any
// mutation/read so stale or legacy duplicate rows never inflate the cart.
const consolidateCart = (cart) => {
  const map = new Map();
  for (const item of cart) {
    const productId = item.product.toString();
    const variantSku = item.variantSku || null;
    const key = variantSku ? `${productId}:${variantSku}` : productId;
    const existing = map.get(key);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      map.set(key, { ...item.toObject ? item.toObject() : item });
    }
  }
  return Array.from(map.values());
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
    // Consolidate before returning so the frontend never sees duplicate rows.
    user.cart = consolidateCart(user.cart || []);
    await user.save();
    const populated = await User.findById(req.user.id).populate('cart.product');
    res.status(200).json({ success: true, cart: populated.cart });
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

    // Validate quantity: must be a positive integer.
    const qty = Math.floor(Number(quantity));
    if (!Number.isFinite(qty) || qty < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be a positive integer' });
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

    if (qty > stock) {
      return res.status(400).json({ success: false, message: `Insufficient stock (max ${stock})` });
    }

    const user = await User.findById(req.user.id);
    // Consolidate first so any pre-existing duplicate rows do not cause the
    // same product+variant to be split across multiple entries.
    user.cart = consolidateCart(user.cart || []);
    const existing = user.cart.find((item) => cartItemHas(item, productId, variantSku));

    if (existing) {
      existing.quantity = Math.min(existing.quantity + qty, stock);
    } else {
      user.cart.push({ product: productId, quantity: qty, variantSku: variantSku || null });
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
    const qty = Math.floor(Number(quantity));
    if (!Number.isFinite(qty) || qty < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
    }

    const user = await User.findById(req.user.id);
    // key format: <productId> or <productId>:<variantSku>
    const sep = req.params.key.indexOf(':');
    const productId = sep === -1 ? req.params.key : req.params.key.slice(0, sep);
    const variantSku = sep === -1 ? null : req.params.key.slice(sep + 1);
    const item = user.cart.find((c) => cartItemHas(c, productId, variantSku));

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
    item.quantity = Math.min(qty, stock || qty);

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
    const sep = req.params.key.indexOf(':');
    const productId = sep === -1 ? req.params.key : req.params.key.slice(0, sep);
    const variantSku = sep === -1 ? null : req.params.key.slice(sep + 1);
    const user = await User.findById(req.user.id);
    user.cart = user.cart.filter((c) => !cartItemHas(c, productId, variantSku));
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
