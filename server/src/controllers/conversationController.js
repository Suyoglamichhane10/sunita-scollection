const Conversation = require('../Models/Conversation');
const Message = require('../Models/Message');
const Order = require('../Models/Order');

const emitToConversation = (req, event, payload) => {
  const io = req.app.get('io');
  if (io) {
    io.to(`conversation_${payload.conversationId}`).emit(event, payload);
    // Notify each participant room
    if (payload.participants) {
      payload.participants.forEach((p) => io.to(`user_${p}`).emit(event, payload));
    }
  }
};

// Get conversations for the current user (customer or admin)
exports.getConversations = async (req, res, next) => {
  try {
    let conversations;
    if (req.user.role === 'admin') {
      conversations = await Conversation.find()
        .populate('customer', 'name email avatar')
        .populate('order', 'orderNumber orderStatus totalAmount')
        .sort({ lastMessageAt: -1 });
    } else {
      conversations = await Conversation.find({
        participants: req.user.id,
      })
        .populate('customer', 'name email avatar')
        .populate('order', 'orderNumber orderStatus totalAmount')
        .sort({ lastMessageAt: -1 });
    }
    res.status(200).json({ success: true, conversations });
  } catch (error) {
    next(error);
  }
};

// Create a conversation (support or order-specific)
exports.createConversation = async (req, res, next) => {
  try {
    const { type, title, orderId, priority, message } = req.body;

    let order = null;
    if (orderId) {
      order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
      if (order.user.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }
    }

    const conversation = await Conversation.create({
      type: type || 'support',
      title: title || (order ? `Order ${order.orderNumber}` : 'Support'),
      order: order ? order._id : undefined,
      customer: req.user.id,
      participants: [req.user.id],
      priority: priority || 'normal',
      status: 'open',
      lastMessageAt: Date.now(),
    });

    // Seed with an initial message if provided
    if (message) {
      const msg = await Message.create({
        conversation: conversation._id,
        sender: req.user.id,
        senderName: req.user.name,
        message,
        messageType: 'text',
        status: 'new',
      });
      conversation.lastMessagePreview = message;
      await conversation.save();

      const io = req.app.get('io');
      if (io) io.to('admins').emit('conversation:new', conversation);

      return res.status(201).json({ success: true, conversation, message: msg });
    }

    const io = req.app.get('io');
    if (io) io.to('admins').emit('conversation:new', conversation);

    res.status(201).json({ success: true, conversation });
  } catch (error) {
    next(error);
  }
};

// Get messages for a conversation
exports.getMessages = async (req, res, next) => {
  try {
    const conversationId = req.params.id;
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }
    const isParticipant =
      req.user.role === 'admin' || conversation.participants.some((p) => p.toString() === req.user.id);
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'name email avatar')
      .sort({ createdAt: 1 });

    // Mark as read by current user
    const readBy = messages.map((m) => m._id);
    await Promise.all(
      messages.map((m) => {
        if (m.sender?._id?.toString() === req.user.id) return null;
        return Message.updateOne(
          { _id: m._id, 'readBy.user': { $ne: req.user.id } },
          { $push: { readBy: { user: req.user.id, readAt: Date.now() } } }
        );
      })
    );

    res.status(200).json({ success: true, messages, readBy });
  } catch (error) {
    next(error);
  }
};

// Send a message in an existing conversation (with file-upload support)
exports.sendMessage = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }
    const isParticipant =
      req.user.role === 'admin' || conversation.participants.some((p) => p.toString() === req.user.id);
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { text, messageType = 'text', attachment } = req.body;

    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user.id,
      senderName: req.user.role === 'admin' ? 'Sunita\u2019s Collection' : req.user.name,
      message: text || (messageType === 'file' ? attachment?.name || 'File' : ''),
      messageType,
      attachment: attachment || undefined,
      order: conversation.order,
      status: 'new',
    });

    conversation.lastMessageAt = Date.now();
    conversation.lastMessagePreview = text || (messageType === 'file' ? '📎 File' : '');
    conversation.status = 'open';
    await conversation.save();

    const io = req.app.get('io');
    const payload = { conversationId: conversation._id, message, participants: conversation.participants };
    if (io) {
      io.to(`conversation_${conversation._id}`).emit('message:new', payload);
      conversation.participants.forEach((p) => io.to(`user_${p}`).emit('message:new', payload));
      if (req.user.role !== 'admin') io.to('admins').emit('message:new', payload);
    }

    res.status(201).json({ success: true, message });
  } catch (error) {
    next(error);
  }
};

// Typing indicator
exports.typing = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }
    const io = req.app.get('io');
    const payload = { conversationId: conversation._id, userId: req.user.id, isTyping: !!req.body.isTyping };
    if (io) {
      io.to(`conversation_${conversation._id}`).emit('typing', payload);
    }
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

// Mark conversation as read (reset unread count)
exports.markRead = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }
    conversation.unreadCount = 0;
    await conversation.save();
    res.status(200).json({ success: true, conversation });
  } catch (error) {
    next(error);
  }
};

// Admin: update conversation (priority, tags, status, assignment)
exports.updateConversation = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }
    const { priority, tags, status, assignedTo } = req.body;
    if (priority) conversation.priority = priority;
    if (tags) conversation.tags = tags;
    if (status) conversation.status = status;
    if (assignedTo) conversation.assignedTo = assignedTo;
    if (status === 'resolved' || status === 'closed') {
      conversation.unreadCount = 0;
    }
    await conversation.save();
    res.status(200).json({ success: true, conversation });
  } catch (error) {
    next(error);
  }
};

// Search messages within a conversation
exports.searchMessages = async (req, res, next) => {
  try {
    const { q } = req.query;
    const conversationId = req.params.id;
    if (!q) {
      return res.status(400).json({ success: false, message: 'Search query required' });
    }
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }
    const messages = await Message.find({
      conversation: conversationId,
      message: { $regex: q, $options: 'i' },
    })
      .populate('sender', 'name avatar')
      .sort({ createdAt: 1 });
    res.status(200).json({ success: true, messages });
  } catch (error) {
    next(error);
  }
};

// Admin: delete a conversation and all its messages
exports.deleteConversation = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    // Delete all messages belonging to this conversation
    await Message.deleteMany({ conversation: conversation._id });

    await conversation.deleteOne();

    // Notify admins so connected clients can refresh
    const io = req.app.get('io');
    if (io) io.to('admins').emit('conversation:deleted', { conversationId: conversation._id });

    res.status(200).json({ success: true, message: 'Conversation deleted' });
  } catch (error) {
    next(error);
  }
};

// Admin: unified inbox stats
exports.getInboxStats = async (req, res, next) => {
  try {
    const [open, urgent, total, resolved] = await Promise.all([
      Conversation.countDocuments({ status: 'open' }),
      Conversation.countDocuments({ priority: 'urgent', status: { $in: ['open', 'pending'] } }),
      Conversation.countDocuments(),
      Conversation.countDocuments({ status: { $in: ['resolved', 'closed'] } }),
    ]);
    res.status(200).json({ success: true, stats: { open, urgent, total, resolved } });
  } catch (error) {
    next(error);
  }
};
