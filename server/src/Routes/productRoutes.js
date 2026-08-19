const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  getInventory,
  adminGetProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
  toggleFeaturedStatus,
  updateProductStock,
  bulkUpdateStock,
} = require('../controllers/productController');
const { protect, authorize } = require('../Middleware/auth');
const { validateProduct, validate } = require('../Middleware/validator');

// Public routes
router.get('/', getProducts);
router.get('/inventory', protect, authorize('admin'), getInventory);
router.get('/admin', protect, authorize('admin'), adminGetProducts);
router.get('/:id', getProduct);

// Admin routes
router.post('/', protect, authorize('admin'), validateProduct, validate, createProduct);
router.put('/:id', protect, authorize('admin'), updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);
router.put('/:id/toggle-status', protect, authorize('admin'), toggleProductStatus);
router.put('/:id/toggle-featured', protect, authorize('admin'), toggleFeaturedStatus);
router.put('/:id/stock', protect, authorize('admin'), updateProductStock);
router.put('/bulk/stock', protect, authorize('admin'), bulkUpdateStock);

module.exports = router;