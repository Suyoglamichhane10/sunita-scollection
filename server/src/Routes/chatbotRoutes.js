const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../Middleware/auth');
const {
  sendMessage,
  escalate,
  getIntents,
  saveIntent,
  deleteIntent,
  getAnalytics,
} = require('../controllers/chatbotController');

// Customer chatbot
router.post('/message', protect, sendMessage);
router.post('/escalate', protect, escalate);

// Admin chatbot training / FAQ + analytics
router.get('/intents', protect, authorize('admin'), getIntents);
router.post('/intents', protect, authorize('admin'), saveIntent);
router.put('/intents/:id', protect, authorize('admin'), saveIntent);
router.delete('/intents/:id', protect, authorize('admin'), deleteIntent);
router.get('/analytics', protect, authorize('admin'), getAnalytics);

module.exports = router;
