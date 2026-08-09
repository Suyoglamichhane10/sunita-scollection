const express = require('express');
const router = express.Router();
const { protect } = require('../Middleware/auth');
const {
  getDashboard,
  getNotifications,
  markNotificationsRead,
  trackView,
  saveLook,
  getSavedLooks,
  deleteLook,
  updateStyleProfile,
} = require('../controllers/dashboardController');

router.get('/', protect, getDashboard);
router.get('/notifications', protect, getNotifications);
router.put('/notifications/read', protect, markNotificationsRead);
router.post('/track-view', protect, trackView);
router.post('/looks', protect, saveLook);
router.get('/looks', protect, getSavedLooks);
router.delete('/looks/:lookId', protect, deleteLook);
router.put('/style-profile', protect, updateStyleProfile);

module.exports = router;
