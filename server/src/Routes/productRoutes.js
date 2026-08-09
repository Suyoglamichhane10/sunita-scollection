const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  getInventory,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect, authorize } = require('../Middleware/auth');
const { validateProduct, validate } = require('../Middleware/validator');

// Public routes
router.get('/', getProducts);
router.get('/inventory', protect, authorize('admin'), getInventory);
router.get('/:id', getProduct);

// Admin routes
router.post('/', protect, authorize('admin'), validateProduct, validate, createProduct);
router.put('/:id', protect, authorize('admin'), updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);

module.exports = router;
