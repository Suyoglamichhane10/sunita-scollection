const express = require('express');
const router = express.Router();
const {
  createDelivery,
  assignDeliveryPerson,
  updateDeliveryStatus,
  updateLocation,
  getDeliveryDetails,
  getActiveDeliveries,
  getNearbyDeliveryPersons,
  trackDelivery,
  deliveryHistory,
  updateEstimatedTime,
  getDeliveryStats,
  deleteDelivery,
} = require('../controllers/deliveryController');
const { protect, authorize } = require('../Middleware/auth');

router.post('/', protect, authorize('admin'), createDelivery);
router.get('/active', protect, authorize('admin'), getActiveDeliveries);
router.get('/stats', protect, authorize('admin'), getDeliveryStats);
router.get('/nearby', protect, authorize('admin'), getNearbyDeliveryPersons);
router.post('/:orderId/assign', protect, authorize('admin'), assignDeliveryPerson);
router.put('/:orderId/status', protect, updateDeliveryStatus);
router.post('/location', protect, updateLocation);
router.get('/:orderId', protect, getDeliveryDetails);
router.get('/tracking/:orderId', protect, trackDelivery);
router.get('/history/:orderId', protect, deliveryHistory);
router.put('/:orderId/estimated-time', protect, authorize('admin'), updateEstimatedTime);
router.delete('/:orderId', protect, authorize('admin'), deleteDelivery);

module.exports = router;
