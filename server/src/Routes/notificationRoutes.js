const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { protect } = require('../Middleware/auth');
const {
  getUnreadCount,
  getNotifications,
  readAll,
  readOne,
  clearAll,
} = require('../controllers/notificationController');

// Polling limiter — higher limit for frequent count polling (every 15s from client)
const pollLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// Stricter limiter for write / list endpoints
const notificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// All notification routes are customer-facing and require authentication
router.get('/unread-count', protect, pollLimiter, getUnreadCount);
router.get('/', protect, notificationLimiter, getNotifications);
router.put('/read-all', protect, notificationLimiter, readAll);
router.put('/:id/read', protect, notificationLimiter, readOne);
router.delete('/', protect, notificationLimiter, clearAll);

module.exports = router;
