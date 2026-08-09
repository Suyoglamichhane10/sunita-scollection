const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../Middleware/auth');
const {
  createMessage,
  getMessages,
  replyMessage,
  updateMessageStatus,
} = require('../controllers/messageController');

router.post('/', protect, createMessage);
router.get('/', protect, getMessages);
router.put('/:id/reply', protect, replyMessage);
router.put('/:id/status', protect, updateMessageStatus);

module.exports = router;
