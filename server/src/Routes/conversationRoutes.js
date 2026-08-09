const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../Middleware/auth');
const {
  getConversations,
  createConversation,
  getMessages,
  sendMessage,
  typing,
  markRead,
  updateConversation,
  searchMessages,
  getInboxStats,
} = require('../controllers/conversationController');

router.get('/', protect, getConversations);
router.post('/', protect, createConversation);
router.get('/inbox/stats', protect, authorize('admin'), getInboxStats);
router.get('/:id/messages', protect, getMessages);
router.post('/:id/messages', protect, sendMessage);
router.post('/:id/typing', protect, typing);
router.put('/:id/read', protect, markRead);
router.get('/:id/search', protect, searchMessages);
router.put('/:id', protect, authorize('admin'), updateConversation);

module.exports = router;
