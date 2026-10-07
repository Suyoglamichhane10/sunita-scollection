const Enquiry = require('../Models/Enquiry');
const Order = require('../Models/Order');
const Conversation = require('../Models/Conversation');
const User = require('../Models/User');
const Payment = require('../Models/Payment');

const ACTIVE_ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'packed', 'shipped'];
const ACTIVE_ENQUIRY_STATUSES = ['pending', 'price_shared', 'negotiating', 'customer_agreed', 'deal_closed'];

const money = (n) => `Rs. ${Number(n || 0).toLocaleString()}`;

exports.getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [enquiries, orders, conversations, user] = await Promise.all([
      Enquiry.countDocuments({ userId, readByCustomer: { $ne: true } }),
      Order.countDocuments({ user: userId, orderStatus: { $in: ACTIVE_ORDER_STATUSES } }),
      Conversation.countDocuments({ participants: userId, unreadCount: { $gt: 0 } }),
      User.findById(userId).select('notifications').lean(),
    ]);

    const userNotifications = user?.notifications || [];
    const rewards = userNotifications.filter((n) => !n.read && n.type === 'promotion').length;

    const counts = {
      total: enquiries + orders + conversations + rewards,
      enquiries,
      orders,
      messages: conversations,
      wishlist: 0,
      rewards,
    };

    res.status(200).json({ success: true, ...counts });
  } catch (error) {
    next(error);
  }
};

exports.getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [enquiries, orders, conversations, user, payments] = await Promise.all([
      Enquiry.find({ userId, readByCustomer: { $ne: true } })
        .populate('productId', 'name images')
        .sort('-createdAt')
        .limit(15),
      Order.find({ user: userId, orderStatus: { $in: ACTIVE_ORDER_STATUSES } })
        .sort('-createdAt')
        .limit(15),
      Conversation.find({ participants: userId, unreadCount: { $gt: 0 } })
        .populate('customer assignedTo order', 'name email orderNumber')
        .sort('-lastMessageAt')
        .limit(15),
      User.findById(userId).select('notifications').lean(),
      Payment.find({ userId, paymentStatus: { $in: ['pending', 'paid', 'failed'] } })
        .populate('orderId', 'orderNumber')
        .sort('-createdAt')
        .limit(10),
    ]);

    const items = [];

    enquiries.forEach((e) => {
      const navigateTo = `/dashboard?tab=enquiries&enquiry=${e._id}`;
      items.push({
        _id: String(e._id),
        type: 'enquiry',
        action: 'admin_replied',
        message: `Admin replied to your enquiry about ${e.productId?.name || e.productName || 'Product'} ${e.quotedPrice ? money(e.quotedPrice) : ''}`,
        shortMessage: e.adminReply || `Enquiry update on ${e.productName || 'Product'}`,
        enquiryId: e._id,
        productId: e.productId,
        read: !!e.readByCustomer,
        createdAt: e.repliedAt || e.updatedAt || e.createdAt,
        navigateTo,
        link: navigateTo,
        status: e.status,
      });
    });

    orders.forEach((o) => {
      const navigateTo = `/dashboard?tab=orders&order=${o._id}`;
      items.push({
        _id: `order-${o._id}`,
        type: 'order',
        action: 'order_status_changed',
        message: `Your order #${o.orderNumber} is now ${o.orderStatus}`,
        shortMessage: `Order #${o.orderNumber} — ${o.orderStatus}`,
        orderId: o._id,
        orderNumber: o.orderNumber,
        read: false,
        createdAt: o.createdAt,
        navigateTo,
        link: navigateTo,
      });
    });

    conversations.forEach((c) => {
      const navigateTo = `/dashboard?tab=messages&chat=${c._id}`;
      items.push({
        _id: `conv-${c._id}`,
        type: 'message',
        action: 'message_received',
        message: `New message from Sunita's Collection`,
        shortMessage: c.lastMessagePreview || 'New message',
        conversationId: c._id,
        read: false,
        createdAt: c.lastMessageAt,
        navigateTo,
        link: navigateTo,
      });
    });

    // The Payment model stores `paymentStatus` and `orderId`; the previous
    // `status` / `order` names matched nothing, so payment notifications never
    // reached the bell at all.
    payments.forEach((p) => {
      const navigateTo = p.orderId
        ? `/dashboard?tab=orders&order=${p.orderId._id || p.orderId}`
        : '/dashboard?tab=orders';
      items.push({
        _id: `payment-${p._id}`,
        type: 'payment',
        action: `payment_${p.paymentStatus}`,
        message: `Payment ${p.paymentStatus} for order #${p.orderId?.orderNumber || 'N/A'} — ${money(p.amount)}`,
        shortMessage: `Payment ${p.paymentStatus} — ${money(p.amount)}`,
        paymentId: p._id,
        orderId: p.orderId?._id || p.orderId || null,
        orderNumber: p.orderId?.orderNumber,
        read: false,
        createdAt: p.createdAt,
        navigateTo,
        link: navigateTo,
      });
    });

    (user?.notifications || [])
      .filter((n) => !n.read)
      .forEach((n) => {
        const mappedType =
          n.type === 'promotion'
            ? 'rewards'
            : n.type === 'order'
              ? 'order'
              : n.type;
        items.push({
          _id: n._id || `dn-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          type: mappedType,
          action: n.action,
          message: n.message || n.title || 'You have a new notification',
          shortMessage: (n.message || n.title || '').slice(0, 60),
          enquiryId: n.enquiryId || undefined,
          orderId: n.orderId || undefined,
          conversationId: n.conversationId || undefined,
          read: false,
          createdAt: n.createdAt,
          navigateTo:
            n.link ||
            (mappedType === 'rewards'
              ? '/dashboard?tab=rewards'
              : mappedType === 'order'
                ? (n.orderId ? `/dashboard?tab=orders&order=${n.orderId}` : '/dashboard?tab=orders')
                : '/dashboard'),
          link: n.link || undefined,
        });
      });

    items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    res.status(200).json({ success: true, notifications: items.slice(0, 30) });
  } catch (error) {
    next(error);
  }
};

exports.readAll = async (req, res, next) => {
  try {
    const userId = req.user.id;

    await Promise.all([
      Enquiry.updateMany({ userId, readByCustomer: { $ne: true } }, { $set: { readByCustomer: true } }),
      User.updateOne(
        { _id: userId },
        { $set: { 'notifications.$[elem].read': true } },
        { arrayFilters: [{ 'elem.read': false }] }
      ),
      Conversation.updateMany(
        { participants: userId, unreadCount: { $gt: 0 } },
        { $set: { unreadCount: 0 } }
      ),
    ]);

    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

exports.readOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type } = req.query;
    const userId = req.user.id;

    if (type === 'enquiry') {
      await Enquiry.updateOne({ _id: id, userId }, { $set: { readByCustomer: true } });
    } else if (type === 'message') {
      const convId = id.startsWith('conv-') ? id.slice(5) : id;
      await Conversation.updateOne({ _id: convId, participants: userId }, { $set: { unreadCount: 0 } });
    } else {
      const realId = id.startsWith('order-') ? id.slice(6) : id;
      await User.updateOne(
        { _id: userId, 'notifications._id': realId },
        { $set: { 'notifications.$.read': true } }
      );
    }

    res.status(200).json({ success: true, message: 'Marked as read' });
  } catch (error) {
    next(error);
  }
};

exports.clearAll = async (req, res, next) => {
  try {
    const userId = req.user.id;

    await Promise.all([
      Enquiry.updateMany({ userId, readByCustomer: { $ne: true } }, { $set: { readByCustomer: true } }),
      User.updateOne(
        { _id: userId },
        { $pull: { notifications: { read: { $ne: true } } } }
      ),
      Conversation.updateMany(
        { participants: userId, unreadCount: { $gt: 0 } },
        { $set: { unreadCount: 0 } }
      ),
    ]);

    res.status(200).json({ success: true, total: 0, enquiries: 0, orders: 0, messages: 0, wishlist: 0, rewards: 0 });
  } catch (error) {
    next(error);
  }
};