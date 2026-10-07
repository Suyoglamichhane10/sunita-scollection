const Order = require('../Models/Order');
const Product = require('../Models/Product');
const User = require('../Models/User');
const Review = require('../Models/Review');
const Conversation = require('../Models/Conversation');
const Message = require('../Models/Message');
const Enquiry = require('../Models/Enquiry');
const Payment = require('../Models/Payment');
const Delivery = require('../Models/Delivery');
const Stripe = require('stripe');
const { sendOrderConfirmation } = require('../services/emailService');
const { decrementStock, restoreStock } = require('../services/stockService');
const loyaltyService = require('../services/loyaltyService');
const automationService = require('../services/automationService');
const crypto = require('crypto');
const { rejectInvalidPhone } = require('../Utils/phoneValidator');

const stripe = process.env.STRIPE_SECRET_KEY ? Stripe(process.env.STRIPE_SECRET_KEY) : null;

// An order can still be cancelled while it is only being prepared. Once it has
// left the warehouse the stock is physically gone, so cancelling is refused and
// the customer has to wait for delivery.
const CANCELLABLE_ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'packed'];

// Terminal orders are safe to remove. A failed payment counts too: the order can
// never complete, so it is dead weight in the customer's history.
const isDeletableOrder = (order) =>
  order.orderStatus === 'cancelled' ||
  order.orderStatus === 'delivered' ||
  order.paymentStatus === 'failed';

const calculateTotals = (items, shippingAddress) => {
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * 0.05);
  const shippingCost = subtotal >= 1000 ? 0 : 100;
  const totalAmount = subtotal + tax + shippingCost;

  return { subtotal, tax, shippingCost, totalAmount };
};

exports.createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, paymentMethod, referralCode } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.street || !shippingAddress.city) {
      return res.status(400).json({ success: false, message: 'Shipping address is incomplete' });
    }

    if (rejectInvalidPhone(res, shippingAddress.phone)) return;

    const consolidatedMap = new Map();
    for (const item of items) {
      const qty = Math.floor(Number(item.quantity));
      if (!Number.isFinite(qty) || qty < 1) {
        return res.status(400).json({ success: false, message: 'Item quantity must be a positive integer' });
      }
      const variantSku = item.variantSku || null;
      const key = `${item.productId}:${variantSku || ''}`;
      const existing = consolidatedMap.get(key);
      if (existing) {
        existing.quantity += qty;
      } else {
        consolidatedMap.set(key, { productId: item.productId, quantity: qty, variantSku });
      }
    }
    const consolidatedItems = Array.from(consolidatedMap.values());

    const approvedEnquiries = await Enquiry.find({
      userId: req.user.id,
      status: { $in: ['deal_closed', 'customer_agreed', 'converted'] },
      dealPrice: { $ne: null },
      productId: { $in: consolidatedItems.map((i) => i.productId) },
    }).select('productId dealPrice');

    const approvedMap = new Map();
    for (const ae of approvedEnquiries) {
      approvedMap.set(ae.productId.toString(), ae.dealPrice);
    }

    for (const item of consolidatedItems) {
      const pid = item.productId.toString();
      if (item.dealPrice != null && item.dealPrice !== '') {
        if (!approvedMap.has(pid)) {
          return res.status(403).json({
            success: false,
            message: `Enquiry for ${item.name || 'product'} requires admin approval before purchase.`,
          });
        }
      }
    }

    const products = await Product.find({ _id: { $in: consolidatedItems.map((item) => item.productId) } });

    let referredBy = null;
    let appliedReferralCode = null;
    if (referralCode) {
      const referrer = await User.findOne({ referralCode: String(referralCode).toUpperCase() });
      if (referrer && referrer._id.toString() !== req.user.id) {
        referredBy = referrer._id;
        appliedReferralCode = String(referralCode).toUpperCase();
      }
    }

    const approvedProductIds = [];
    const lineItems = consolidatedItems.map((item) => {
      const product = products.find((p) => p._id.toString() === item.productId);
      if (!product) throw new Error('Product not found');

      let variant = null;
      if (item.variantSku && product.variants && product.variants.length) {
        variant = product.variants.find(
          (v) => (v.sku && v.sku === item.variantSku) || (v._id && v._id.toString() === item.variantSku)
        );
      }

      if (variant && item.quantity > (variant.stock || 0)) {
        throw new Error(`Insufficient stock for variant ${variant.title || variant.sku}`);
      }
      if (!variant && item.quantity > (product.stock || 0)) {
        throw new Error(`Insufficient stock for product ${product.name}`);
      }

      let finalPrice;
      let isDeal = false;
      if (item.dealPrice != null && item.dealPrice !== '') {
        const approvedDeal = approvedMap.get(item.productId.toString());
        if (approvedDeal == null) {
          throw new Error('Deal price not authorized');
        }
        finalPrice = Number(approvedDeal);
        isDeal = true;
      } else {
        finalPrice = variant?.price ?? product.price;
      }

      if (finalPrice <= 0) {
        throw new Error(`Invalid price for product ${product.name}`);
      }

      const image = variant?.images?.[0]?.url || product.images?.[0]?.url || '';
      const variantTitle = variant ? variant.title || Array.from(variant.attributes || new Map()).map(([key, value]) => value).join(' / ') : null;

      if (isDeal) {
        approvedProductIds.push(item.productId.toString());
      }

      return {
        product: product._id,
        name: product.name,
        price: finalPrice,
        quantity: item.quantity,
        image,
        total: finalPrice * item.quantity,
        variantSku: variant?.sku || null,
        variantTitle,
      };
    });

    const totals = calculateTotals(lineItems, shippingAddress);

    // Mark related enquiries as converted after successful order creation
    if (approvedEnquiries.length) {
      try {
        await Enquiry.updateMany(
          { _id: { $in: approvedEnquiries.map((e) => e._id) }, userId: req.user.id },
          { $set: { status: 'converted', approvedAt: new Date() } }
        );
      } catch (convertErr) {
        console.error('Failed to convert enquiries:', convertErr.message);
      }
    }

    const order = await Order.create({
      user: req.user.id,
      items: lineItems,
      subtotal: totals.subtotal,
      tax: totals.tax,
      shippingCost: totals.shippingCost,
      totalAmount: totals.totalAmount,
      paymentMethod: paymentMethod || 'cod',
      paymentStatus: 'pending',
      shippingAddress,
      orderStatus: 'pending',
      isPaid: false,
      statusHistory: [
        {
          status: 'pending',
          note: 'Order created',
          updatedBy: req.user.id,
        },
      ],
      deliveryDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      referralCode: appliedReferralCode,
      referredBy,
    });

    const customerName = req.user.name || 'A customer';
    const io = req.app.get('io');

    const notifyAdmins = async () => {
      const message = `New order #${order.orderNumber} from ${customerName} — Rs. ${totals.totalAmount}`;
      try {
        const admins = await User.find({ role: 'admin' }).select('_id');
        const adminNotifications = admins.map((admin) => ({
          user: admin._id,
          message,
          type: 'order',
          action: 'order_placed',
          orderId: order._id.toString(),
          link: `/admin/orders?order=${order._id}`,
          read: false,
          createdAt: Date.now(),
        }));
        if (adminNotifications.length) {
          await User.bulkWrite(
            adminNotifications.map((n) => ({
              updateOne: {
                filter: { _id: n.user },
                update: { $push: { notifications: n } },
              },
            }))
          );
        }
      } catch (err) {
        console.error('Admin notification persistence failed:', err.message);
      }
    };

    if (io) {
      io.to('admins').emit('notification:new', {
        id: `order-placed-${order._id}`,
        message,
        type: 'order',
        action: 'order_placed',
        orderId: order._id.toString(),
        link: `/admin/orders?order=${order._id}`,
        createdAt: Date.now(),
      });
    }

    await notifyAdmins();

    await User.findByIdAndUpdate(req.user.id, { $push: { orderHistory: order._id } });

    try {
      const Delivery = require('../Models/Delivery');
      const delivery = await Delivery.create({
        orderId: order._id,
        status: 'pending',
        pickupLocation: {
          lat: 27.7172,
          lng: 85.324,
          address: shippingAddress.street || '',
        },
        deliveryLocation: {
          lat: 27.7172,
          lng: 85.324,
          address: `${shippingAddress.street}, ${shippingAddress.city}`,
        },
        estimatedDeliveryTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      });
      await Order.findByIdAndUpdate(order._id, {
        'delivery.assigned': false,
        'delivery.status': 'pending',
        'delivery.estimatedTime': delivery.estimatedDeliveryTime,
        'delivery.pickupLocation': delivery.pickupLocation,
        'delivery.deliveryLocation': delivery.deliveryLocation,
      });
    } catch (deliveryErr) {
      console.error('Delivery creation failed:', deliveryErr.message);
    }

    // For gateway payments (eSewa / FonePay / Stripe), stock is decremented only
    // after payment verification (see orderFinalizeService). For COD, decrement
    // stock now using atomic operations to prevent overselling.
    const isDeferredPayment = ['esewa', 'fonepay'].includes(paymentMethod);
    if (!isDeferredPayment) {
      const stockItems = lineItems.map((li) => ({
        product: li.product,
        quantity: li.quantity,
        variantSku: li.variantSku,
      }));
      await decrementStock(stockItems);
      order.stockDeducted = true;
      await order.save({ validateBeforeSave: false });
    }

    // Send order confirmation email + award loyalty points (non-blocking).
    // For eSewa/FonePay these are deferred until payment verification
    // (handled in orderFinalizeService), so they are skipped here.
    if (!isDeferredPayment) {
      try {
        const user = await User.findById(req.user.id);
        if (user) {
          sendOrderConfirmation(user, order);
        }
      } catch (emailErr) {
        console.error('Email send failed:', emailErr.message);
      }

      setImmediate(async () => {
        try {
          const points = Math.round(order.totalAmount / 10); // 1 point per Rs. 10
          await loyaltyService.awardPoints(req.user.id, points, 'purchase');
          await loyaltyService.updateChallengeProgress(req.user.id, 'first_purchase');
          await loyaltyService.updateChallengeProgress(req.user.id, 'place_3_orders');
          await automationService.onOrderStatusChange(order);
        } catch (err) {
          console.error('Loyalty/automation error:', err.message);
        }
      });
    }

    res.status(201).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    const { orderStatus, paymentStatus, trackingNumber } = req.body;
    if (orderStatus && orderStatus !== order.orderStatus) {
      order.orderStatus = orderStatus;
      order.statusHistory.push({
        status: orderStatus,
        note: `Status updated to ${orderStatus}`,
        updatedBy: req.user.id,
      });

      const deliveryStatusMap = {
        pending: 'pending',
        confirmed: 'confirmed',
        processing: 'confirmed',
        packed: 'picked_up',
        shipped: 'in_transit',
        delivered: 'delivered',
        cancelled: 'cancelled',
      };

      const mappedStatus = deliveryStatusMap[orderStatus];
      if (mappedStatus) {
        try {
          const Delivery = require('../Models/Delivery');
          await Delivery.findOneAndUpdate(
            { orderId: order._id },
            {
              status: mappedStatus,
              ...(orderStatus === 'delivered' ? { actualDeliveryTime: new Date() } : {}),
            }
          );
        } catch (deliveryErr) {
          console.error('Delivery status sync failed:', deliveryErr.message);
        }
      }
    }
    if (trackingNumber !== undefined) {
      order.trackingNumber = trackingNumber;
    }
    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
      if (paymentStatus === 'paid') {
        order.isPaid = true;
        order.paidAt = new Date();
      }
      if (paymentStatus === 'refunded') {
        order.isPaid = false;
      }
    }
if (orderStatus === 'delivered') {
      order.isDelivered = true;
      order.deliveredAt = new Date();
    }
await order.save();

    if (orderStatus === 'delivered') {
      if (order.referredBy) {
        setImmediate(async () => {
          try {
            await loyaltyService.awardPoints(order.referredBy, 300, 'referral_purchase');
            await loyaltyService.awardBadge(order.referredBy, 'referrer');
          } catch (err) {
            console.error('Referral reward error:', err.message);
          }
        });
      }
      setImmediate(async () => {
        try {
          const user = await User.findById(order.user);
          if (user && !user.referralCode) {
            user.referralCode = crypto.randomBytes(4).toString('hex').toUpperCase();
            await user.save();
          }
        } catch (err) {
          console.error('Referral code generation error:', err.message);
        }
      });
    }

    // Emit live order-tracking update to the customer's order room
    try {
      const app = require('../app');
      const io = app.get('io');
      if (io) {
        io.to(`order_${order._id}`).emit('order:status', {
          orderId: order._id,
          orderStatus: order.orderStatus,
          paymentStatus: order.paymentStatus,
          trackingNumber: order.trackingNumber,
          statusHistory: order.statusHistory,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (socketErr) {
      console.error('Order socket emit failed:', socketErr.message);
    }

    // Trigger chat automation + notification for the customer (non-blocking)
    if (orderStatus && orderStatus !== '_initial') {
      setImmediate(async () => {
        try {
          await automationService.onOrderStatusChange(order);
        } catch (err) {
          console.error('Order status automation error:', err.message);
        }
      });
    }

    const ioAdmin = req.app.get('io');
    if (ioAdmin && orderStatus) {
      const statusMessage = `Order #${order.orderNumber} status updated to ${orderStatus}`;
      ioAdmin.to('admins').emit('notification:new', {
        id: `order-status-${order._id}-${orderStatus}`,
        message: statusMessage,
        type: 'order',
        action: 'order_status_changed',
        orderId: order._id.toString(),
        link: `/admin/orders?order=${order._id}`,
        createdAt: Date.now(),
      });

      // The customer is the one who needs to know their parcel moved.
      const customerMessage = `Your order #${order.orderNumber} is now ${orderStatus}`;
      const at = new Date();
      setImmediate(async () => {
        try {
          await User.updateOne(
            { _id: order.user },
            {
              $push: {
                notifications: {
                  message: customerMessage,
                  type: 'order',
                  action: 'order_status_changed',
                  orderId: order._id.toString(),
                  link: `/dashboard?tab=orders&order=${order._id}`,
                  read: false,
                  createdAt: at,
                },
              },
            }
          );
        } catch (err) {
          console.error('Customer order-status notification persist failed:', err.message);
        }
      });

      ioAdmin.to(`user_${order.user}`).emit('notification:new', {
        id: `order-status-${order._id}-${orderStatus}`,
        message: customerMessage,
        type: 'order',
        action: 'order_status_changed',
        orderId: order._id.toString(),
        link: `/dashboard?tab=orders&order=${order._id}`,
        createdAt: at.getTime(),
      });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders });
  } catch (error) {
    next(error);
  }
};

exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.product');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    const orderUserId = order.user?._id?.toString?.() || order.user?.toString?.();
    if (orderUserId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized access' });
    }
    res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

exports.getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders });
  } catch (error) {
    next(error);
  }
};

// Removing an order takes its dependants with it: reviews would otherwise keep
// recalculating product ratings from a dead order, and messages, delivery
// records and payments would be left pointing at nothing.
const detachOrderDependants = async (order) => {
  const orderId = order._id;
  const userId = order.user;

  const reviews = await Review.find({ order: orderId }).select('product');
  await Review.deleteMany({ order: orderId });
  for (const r of reviews) {
    if (!r.product) continue;
    const stats = await Review.aggregate([
      { $match: { product: r.product, isApproved: true } },
      { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    await Product.findByIdAndUpdate(r.product, {
      'rating.average': stats.length ? stats[0].avgRating : 0,
      'rating.count': stats.length ? stats[0].count : 0,
    });
  }

  await Message.deleteMany({ order: orderId });
  await Conversation.deleteMany({ order: orderId });
  await Payment.deleteMany({ orderId });
  await Delivery.deleteMany({ orderId });

  if (userId) {
    await User.updateOne(
      { _id: userId },
      { $pull: { orderHistory: orderId } }
    );
  }
};

// @desc    Delete an order - customer may delete their own terminal order,
//          admin may delete any terminal order
// @route   DELETE /api/orders/:id
// @access  Private
exports.deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const isAdmin = req.user.role === 'admin';
    if (!isAdmin && order.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this order' });
    }

    if (!isDeletableOrder(order)) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete an order that is still ${order.orderStatus}. Cancel it first, then delete it.`,
      });
    }

    await detachOrderDependants(order);
    await order.deleteOne();

    res.status(200).json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel an order - customer may cancel their own order while it is
//          still being prepared, admin may cancel any such order
// @route   PUT /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const isAdmin = req.user.role === 'admin';
    if (!isAdmin && order.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to cancel this order' });
    }

    if (!CANCELLABLE_ORDER_STATUSES.includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message:
          order.orderStatus === 'cancelled'
            ? 'This order is already cancelled.'
            : `Cannot cancel an order that is already ${order.orderStatus}.`,
      });
    }

    const reason = (req.body?.reason || '').trim() || 'No reason given';

    order.orderStatus = 'cancelled';
    order.cancelledAt = new Date();
    order.cancellationReason = reason;
    order.statusHistory.push({
      status: 'cancelled',
      note: `Order cancelled by ${isAdmin ? 'admin' : 'customer'}: ${reason}`,
      updatedBy: req.user.id,
    });

    // Only give the stock back if it was actually taken, and only once - a
    // gateway order that never verified never had its stock decremented.
    const shouldRestoreStock = order.stockDeducted && !order.stockRestoredAt;
    if (shouldRestoreStock) {
      order.stockRestoredAt = new Date();
    }

    await order.save();

    if (shouldRestoreStock) {
      try {
        await restoreStock(
          order.items.map((item) => ({
            product: item.product,
            quantity: item.quantity,
            variantSku: item.variantSku,
          }))
        );
      } catch (stockErr) {
        console.error('Stock restore on cancellation failed:', stockErr.message);
      }
    }

    try {
      await Delivery.findOneAndUpdate(
        { orderId: order._id },
        { status: 'cancelled', notes: `Order cancelled: ${reason}` }
      );
    } catch (deliveryErr) {
      console.error('Delivery cancellation failed:', deliveryErr.message);
    }

    try {
      const app = require('../app');
      const io = app.get('io');
      if (io) {
        io.to(`order_${order._id}`).emit('order:status', {
          orderId: order._id,
          orderStatus: order.orderStatus,
          statusHistory: order.statusHistory,
          updatedAt: new Date().toISOString(),
        });
        io.to('admins').emit('order:updated', {
          orderId: order._id,
          orderStatus: order.orderStatus,
        });
      }
    } catch (socketErr) {
      console.error('Order socket emit failed:', socketErr.message);
    }

    // A customer-initiated cancellation is the one the store owner has to act
    // on, so it lands in the admin bell both live and on reload.
    if (!isAdmin) {
      const customerName = req.user.name || 'A customer';
      const message = `Order #${order.orderNumber} was cancelled by ${customerName} — ${reason}`;
      const at = new Date();

      try {
        const io = req.app.get('io');
        if (io) {
          io.to('admins').emit('notification:new', {
            id: `order-cancelled-${order._id}`,
            message,
            type: 'order',
            action: 'order_cancelled',
            orderId: order._id.toString(),
            link: `/admin/orders?order=${order._id}`,
            createdAt: at.getTime(),
          });
        }
      } catch (socketErr) {
        console.error('Admin cancellation notification emit failed:', socketErr.message);
      }

      try {
        await User.updateMany(
          { role: 'admin' },
          {
            $push: {
              notifications: {
                message,
                type: 'order',
                action: 'order_cancelled',
                orderId: order._id.toString(),
                link: `/admin/orders?order=${order._id}`,
                read: false,
                createdAt: at,
              },
            },
          }
        );
      } catch (persistErr) {
        console.error('Admin cancellation notification persist failed:', persistErr.message);
      }
    }

    res.status(200).json({ success: true, order, message: 'Order cancelled successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get operational dashboard metrics
// @route   GET /api/orders/metrics
// @access  Private/Admin
exports.getOrderMetrics = async (req, res, next) => {
  try {
    const [orderStats, customerCount, productCount, lowStockProducts, recentOrders] = await Promise.all([
      Order.aggregate([
        { $match: { orderStatus: { $ne: 'cancelled' } } },
        { $group: { _id: null, revenue: { $sum: '$totalAmount' }, orders: { $sum: 1 } } },
      ]),
      User.countDocuments({ role: 'customer' }),
      Product.countDocuments(),
      Product.find({ $expr: { $lte: ['$stock', '$lowStockThreshold'] } }).select('name stock lowStockThreshold'),
      Order.find().populate('user', 'name').sort({ createdAt: -1 }).limit(5),
    ]);

    res.status(200).json({
      success: true,
      metrics: {
        revenue: orderStats[0]?.revenue || 0,
        orders: orderStats[0]?.orders || 0,
        customers: customerCount,
        products: productCount,
        lowStock: lowStockProducts,
        recentOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order invoice HTML
// @route   GET /api/orders/:id/invoice
// @access  Private
exports.getOrderInvoice = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('delivery.deliveryPersonId', 'name phone vehicle');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const orderUserId = order.user?._id?.toString?.() || order.user?.toString?.();
    if (orderUserId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const formatCurrency = (n) => `Rs. ${Number(n || 0).toLocaleString()}`;
    const formatDate = (d) => (d ? new Date(d).toLocaleString() : '—');

    const invoiceHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Invoice ${order.orderNumber}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; margin: 0; padding: 24px; color: #222; }
    .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; border-radius: 12px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
    .title { font-size: 24px; font-weight: bold; color: #111; }
    .meta { text-align: right; font-size: 13px; color: #555; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { padding: 10px 8px; border-bottom: 1px solid #eee; text-align: left; font-size: 14px; }
    th { background: #f8f8f8; }
    .right { text-align: right; }
    .totals { margin-top: 10px; }
    .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
    .totals-row.grand { font-weight: bold; border-top: 2px solid #111; margin-top: 6px; padding-top: 10px; }
    .footer { margin-top: 30px; font-size: 12px; color: #777; text-align: center; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: bold; }
    .badge-paid { background: #dcfce7; color: #166534; }
    .badge-pending { background: #fef9c3; color: #854d0e; }
  </style>
</head>
<body>
  <div class="invoice-box">
    <div class="header">
      <div>
        <div class="title">INVOICE</div>
        <div style="margin-top:6px; font-size:14px; color:#555;">Sunita'z Collection</div>
        <div style="font-size:13px; color:#555;">Elegance for Every Woman</div>
      </div>
      <div class="meta">
        <div><strong>Invoice #:</strong> ${order.orderNumber}</div>
        <div><strong>Date:</strong> ${formatDate(order.createdAt)}</div>
        <div><strong>Payment:</strong> ${order.paymentMethod?.toUpperCase() || '—'}</div>
        <div><strong>Status:</strong> <span class="badge ${order.isPaid ? 'badge-paid' : 'badge-pending'}">${order.paymentStatus}</span></div>
      </div>
    </div>

    <div style="margin-top: 24px; display: flex; gap: 24px; flex-wrap: wrap;">
      <div style="flex: 1; min-width: 220px;">
        <div style="font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; color: #777;">Bill To</div>
        <div style="margin-top: 6px; font-size: 14px;">
          <div>${order.shippingAddress?.fullName || '—'}</div>
          <div>${order.shippingAddress?.street || ''}</div>
          <div>${order.shippingAddress?.city || ''}${order.shippingAddress?.state ? ', ' + order.shippingAddress.state : ''}</div>
          <div>${order.shippingAddress?.country || 'Nepal'}</div>
          <div>${order.shippingAddress?.phone || ''}</div>
        </div>
      </div>
      <div style="flex: 1; min-width: 220px;">
        <div style="font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; color: #777;">Ship To</div>
        <div style="margin-top: 6px; font-size: 14px;">
          <div>${order.shippingAddress?.fullName || '—'}</div>
          <div>${order.shippingAddress?.street || ''}</div>
          <div>${order.shippingAddress?.city || ''}${order.shippingAddress?.state ? ', ' + order.shippingAddress.state : ''}</div>
          <div>${order.shippingAddress?.country || 'Nepal'}</div>
        </div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th style="text-align: right;">Price</th>
          <th style="text-align: right;">Qty</th>
          <th style="text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${(order.items || []).map((item) => `
          <tr>
            <td>
              <div style="font-weight: 600;">${item.name}</div>
              ${item.variantTitle ? `<div style="font-size: 12px; color: #666;">${item.variantTitle}</div>` : ''}
            </td>
            <td class="right">${formatCurrency(item.price)}</td>
            <td class="right">${item.quantity}</td>
            <td class="right">${formatCurrency(item.total)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-row"><span>Subtotal</span><span>${formatCurrency(order.subtotal)}</span></div>
      <div class="totals-row"><span>Tax</span><span>${formatCurrency(order.tax)}</span></div>
      <div class="totals-row"><span>Shipping</span><span>${order.shippingCost === 0 ? 'Free' : formatCurrency(order.shippingCost)}</span></div>
      ${order.discount > 0 ? `<div class="totals-row"><span>Discount</span><span>-${formatCurrency(order.discount)}</span></div>` : ''}
      <div class="totals-row grand"><span>Grand Total</span><span>${formatCurrency(order.totalAmount)}</span></div>
    </div>

    <div class="footer">
      Thank you for shopping with Sunita'z Collection. For support, contact us through the website.
    </div>
  </div>
</body>
</html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(invoiceHtml);
  } catch (error) {
    next(error);
  }
};

