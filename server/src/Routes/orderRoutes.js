const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getMyOrders,
  getOrder,
  updateOrderStatus,
  deleteOrder,
  cancelOrder,
  getOrderMetrics,
  getOrderInvoice,
} = require('../controllers/orderController');
const deliveryRoutes = require('./deliveryRoutes');
const { protect, authorize } = require('../Middleware/auth');

// Protected routes
router.post('/', protect, createOrder);
router.get('/my-orders', protect, getMyOrders);
router.get('/metrics', protect, authorize('admin'), getOrderMetrics);
router.get('/:id/invoice', protect, getOrderInvoice);
router.get('/:id', protect, getOrder);
router.put('/:id/cancel', protect, cancelOrder);

// Admin routes
router.get('/', protect, authorize('admin'), getOrders);
router.put('/:id/status', protect, authorize('admin'), updateOrderStatus);
router.delete('/:id', protect, authorize('admin'), deleteOrder);

module.exports = router;
