const express = require('express');
const router = express.Router();
const { protect } = require('../Middleware/auth');
const {
  getDashboard,
  getNotifications,
  markNotificationsRead,
  clearNotifications,
  updateStyleProfile,
} = require('../controllers/dashboardController');

router.get('/', protect, getDashboard);
router.get('/notifications', protect, getNotifications);
router.put('/notifications/read', protect, markNotificationsRead);
router.delete('/notifications', protect, clearNotifications);
router.put('/style-profile', protect, updateStyleProfile);

module.exports = router;
