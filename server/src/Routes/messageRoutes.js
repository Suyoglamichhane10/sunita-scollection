const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../Middleware/auth');
const {
  createMessage,
  createPublicMessage,
  createPublicTikTokMessage,
  getMessages,
  replyMessage,
  updateMessageStatus,
  deleteMessage,
} = require('../controllers/messageController');

router.post('/', protect, createMessage);
router.post('/public', createPublicMessage);
router.post('/tiktok/public', createPublicTikTokMessage);
router.get('/', protect, getMessages);
router.put('/:id/reply', protect, replyMessage);
router.put('/:id/status', protect, updateMessageStatus);
router.delete('/:id', protect, authorize('admin'), deleteMessage);

module.exports = router;
