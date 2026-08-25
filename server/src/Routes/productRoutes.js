const express = require('express');
const router = express.Router();
const {
  getProducts,
  getHomeSections,
  getProductsByBrand,
  getProductsByColor,
  getSuggestions,
  getRelatedProducts,
  getInventory,
  adminGetProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
  toggleFeaturedStatus,
  updateProductStock,
  bulkUpdateStock,
  getProductsByFeaturedCategory,
  updateProductCategories,
  reorderFeaturedProducts,
  trackProductView,
} = require('../controllers/productController');
const { protect, authorize } = require('../Middleware/auth');
const { validateProduct, validate } = require('../Middleware/validator');

// Public routes
router.get('/', getProducts);
router.get('/home/sections', getHomeSections);
router.get('/groups/brands', getProductsByBrand);
router.get('/groups/colors', getProductsByColor);
router.get('/inventory', protect, authorize('admin'), getInventory);
router.get('/admin', protect, authorize('admin'), adminGetProducts);
router.get('/suggestions', getSuggestions);
router.get('/related/:productId', getRelatedProducts);
router.get('/featured', getProductsByFeaturedCategory);
router.get('/:id', getProduct);

// Admin routes
router.post('/', protect, authorize('admin'), validateProduct, validate, createProduct);
router.put('/:id', protect, authorize('admin'), updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);
router.put('/:id/toggle-status', protect, authorize('admin'), toggleProductStatus);
router.put('/:id/toggle-featured', protect, authorize('admin'), toggleFeaturedStatus);
router.put('/:id/stock', protect, authorize('admin'), updateProductStock);
router.put('/:id/categories', protect, authorize('admin'), updateProductCategories);
router.put('/bulk/stock', protect, authorize('admin'), bulkUpdateStock);
router.put('/featured/reorder', protect, authorize('admin'), reorderFeaturedProducts);
router.post('/:id/view', trackProductView);

module.exports = router;
