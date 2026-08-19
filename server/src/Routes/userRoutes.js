const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect, authorize } = require('../Middleware/auth');
const {
  getUsers,
  updateUserRole,
  deleteUser,
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
  uploadAvatar,
  deleteAvatar,
  uploadUserAvatar,
  deleteUserAvatar,
  getUserAvatar,
} = require('../controllers/userController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

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
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);
router.delete('/avatar', protect, deleteAvatar);
router.get('/:id/avatar', getUserAvatar);
router.put('/:id/role', protect, authorize('admin'), updateUserRole);
router.delete('/:id', protect, authorize('admin'), deleteUser);
router.get('/:id', protect, authorize('admin'), getUserById);
router.post('/:id/avatar', protect, authorize('admin'), upload.single('avatar'), uploadUserAvatar);
router.delete('/:id/avatar', protect, authorize('admin'), deleteUserAvatar);

module.exports = router;