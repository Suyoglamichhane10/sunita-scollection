// Intelligent automation system: triggered order-status notifications,
// lifecycle emails, and chat messages based on user behavior.

const Conversation = require('../Models/Conversation');
const Message = require('../Models/Message');
const User = require('../Models/User');
const { sendOrderConfirmation } = require('./emailService');

// Send an automated chat message in an order conversation
exports.sendOrderChatUpdate = async (order) => {
  try {
    let conversation = await Conversation.findOne({ order: order._id, type: 'order' });
    if (!conversation) {
      conversation = await Conversation.create({
        type: 'order',
        title: `Order ${order.orderNumber}`,
        order: order._id,
        customer: order.user,
        participants: [order.user],
        status: 'open',
        lastMessageAt: Date.now(),
      });
    }

    const statusMessages = {
      confirmed: 'Your order has been confirmed! 🎉',
      processing: 'Your order is now being processed.',
      packed: 'Your order has been packed and is ready for dispatch.',
      shipped: `Your order is on its way!${order.trackingNumber ? ` Tracking: ${order.trackingNumber}` : ''}`,
      delivered: 'Your order has been delivered. We hope you love it! 💖',
      cancelled: 'Your order has been cancelled.',
    };

    const text = statusMessages[order.orderStatus];
    if (!text) return;

    const message = await Message.create({
      conversation: conversation._id,
      sender: order.user,
      senderName: 'Sunita\u2019s Collection',
      message: text,
      messageType: 'system',
      isAutomated: true,
      order: order._id,
      status: 'new',
    });

    conversation.lastMessageAt = Date.now();
    conversation.lastMessagePreview = text;
    conversation.unreadCount += 1;
    await conversation.save();

    // Notify via socket
    const app = require('../app');
    const io = app.get('io');
    if (io) {
      io.to(`user_${order.user}`).emit('message:new', { conversationId: conversation._id, message });
      io.to(`conversation_${conversation._id}`).emit('message:new', { conversationId: conversation._id, message });
    }

    return message;
  } catch (error) {
    console.error('Order chat update failed:', error.message);
    return null;
  }
};

// Push a notification to the user's notification center
exports.pushNotification = async (userId, { message, type = 'system' }) => {
  try {
    await User.findByIdAndUpdate(userId, {
      $push: {
        notifications: { message, type, read: false, createdAt: Date.now() },
      },
    });
    const app = require('../app');
    const io = app.get('io');
    if (io) {
      io.to(`user_${userId}`).emit('notification:new', { message, type, createdAt: Date.now() });
    }
  } catch (error) {
    console.error('Push notification failed:', error.message);
  }
};

// Lifecycle trigger example: cart abandonment reminder
exports.sendCartReminder = async (userId) => {
  const user = await User.findById(userId);
  if (!user || !user.cart || !user.cart.length) return;
  await this.pushNotification(userId, {
    message: "You still have items in your cart! Complete your purchase now. 🛍️",
    type: 'promotion',
  });
};

// Entry point to run automation on order status change
exports.onOrderStatusChange = async (order) => {
  await this.sendOrderChatUpdate(order);
  await this.pushNotification(order.user, {
    message: `Your order ${order.orderNumber} is now ${order.orderStatus}.`,
    type: 'order',
  });
// Non-blocking email (only for confirmation)
  if (order.orderStatus === 'confirmed') {
    try {
      const user = await User.findById(order.user);
      if (user) sendOrderConfirmation(user, order);
    } catch (err) {
      console.error('Email send failed:', err.message);
    }
  }
};
