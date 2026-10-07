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
// One DELETE handler serves both roles: it checks ownership for customers and
// allows admins through. Registering a second admin-only DELETE /:id here would
// be dead code, because the first match always wins.
router.delete('/:id', protect, deleteOrder);
router.put('/:id/cancel', protect, cancelOrder);

// Admin routes
router.get('/', protect, authorize('admin'), getOrders);
router.put('/:id/status', protect, authorize('admin'), updateOrderStatus);

module.exports = router;
