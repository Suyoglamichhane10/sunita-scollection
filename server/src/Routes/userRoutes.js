const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../Middleware/auth');
const {
  getUsers,
  updateUserRole,
  getProfile,
  updateProfile,
  getUserById,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  changePassword,
getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} = require('../controllers/userController');

router.get('/', protect, authorize('admin'), getUsers);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/profile/password', protect, changePassword);
router.get('/profile/addresses', protect, getAddresses);
router.post('/profile/addresses', protect, addAddress);
router.put('/profile/addresses/:addressId', protect, updateAddress);
router.delete('/profile/addresses/:addressId', protect, deleteAddress);
router.get('/profile/wishlist', protect, getWishlist);
router.post('/profile/wishlist/:productId', protect, addToWishlist);
router.delete('/profile/wishlist/:productId', protect, removeFromWishlist);
router.get('/profile/cart', protect, getCart);
router.post('/profile/cart', protect, addToCart);
router.delete('/profile/cart', protect, clearCart);
router.put('/profile/cart/:key', protect, updateCartItem);
router.delete('/profile/cart/:key', protect, removeCartItem);
router.put('/:id/role', protect, authorize('admin'), updateUserRole);
router.get('/:id', protect, authorize('admin'), getUserById);

module.exports = router;