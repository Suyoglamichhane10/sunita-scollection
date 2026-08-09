const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getMyOrders,
  getOrder,
  updateOrderStatus,
  getOrderMetrics,
} = require('../controllers/orderController');
const { protect, authorize } = require('../Middleware/auth');

// Protected routes
router.post('/', protect, createOrder);
router.get('/my-orders', protect, getMyOrders);
router.get('/metrics', protect, authorize('admin'), getOrderMetrics);
router.get('/:id', protect, getOrder);

// Admin routes
router.get('/', protect, authorize('admin'), getOrders);
router.put('/:id/status', protect, authorize('admin'), updateOrderStatus);

module.exports = router;
