const Order = require('../Models/Order');
const Product = require('../Models/Product');
const User = require('../Models/User');
const Review = require('../Models/Review');
const Conversation = require('../Models/Conversation');
const Message = require('../Models/Message');
const Stripe = require('stripe');
const { sendOrderConfirmation } = require('../services/emailService');
const { decrementStock } = require('../services/stockService');
const loyaltyService = require('../services/loyaltyService');
const automationService = require('../services/automationService');

const stripe = process.env.STRIPE_SECRET_KEY ? Stripe(process.env.STRIPE_SECRET_KEY) : null;

const calculateTotals = (items, shippingAddress) => {
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * 0.05);
  const shippingCost = subtotal >= 1000 ? 0 : 100;
  const totalAmount = subtotal + tax + shippingCost;

  return { subtotal, tax, shippingCost, totalAmount };
};

exports.createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;

if (!items || !items.length) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.street || !shippingAddress.city) {
      return res.status(400).json({ success: false, message: 'Shipping address is incomplete' });
    }

// Consolidate incoming line items by product + variant so that duplicate
    // rows for the same product+variant are merged into a single quantity.
    // This keeps the order summary accurate and prevents inflated totals.
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

const products = await Product.find({ _id: { $in: consolidatedItems.map((item) => item.productId) } });

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

      const price = variant?.price ?? product.price;
      const image = variant?.images?.[0]?.url || product.images?.[0]?.url || '';
      const variantTitle = variant ? variant.title || Array.from(variant.attributes || new Map()).map(([key, value]) => value).join(' / ') : null;

      return {
        product: product._id,
        name: product.name,
        price,
        quantity: item.quantity,
        image,
        total: price * item.quantity,
        variantSku: variant?.sku || null,
        variantTitle,
      };
    });

    const totals = calculateTotals(lineItems, shippingAddress);

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
      isPaid: paymentMethod === 'stripe' ? false : false,
      statusHistory: [
        {
          status: 'pending',
          note: 'Order created',
          updatedBy: req.user.id,
        },
      ],
      deliveryDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    });

    const customerName = req.user.name || 'A customer';
    const io = req.app.get('io');
    if (io) {
      io.to('admins').emit('notification:new', {
        message: `New order #${order._id.toString().slice(-6)} from ${customerName} — Rs. ${totals.totalAmount}`,
        type: 'order',
        createdAt: Date.now(),
      });
    }

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

    // For gateway payments (eSewa / Khalti / Stripe), stock is decremented only
    // after payment verification (see orderFinalizeService). For COD, decrement
    // stock now using atomic operations to prevent overselling.
    const isDeferredPayment = ['esewa', 'khalti', 'fonepay'].includes(paymentMethod);
    if (!isDeferredPayment) {
      const stockItems = lineItems.map((li) => ({
        product: li.product,
        quantity: li.quantity,
        variantSku: li.variantSku,
      }));
      await decrementStock(stockItems);
    }

    // Send order confirmation email + award loyalty points (non-blocking).
    // For eSewa/Khalti these are deferred until payment verification
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
      ioAdmin.to('admins').emit('notification:new', {
        message: `Order #${order._id.toString().slice(-6)} status updated to ${orderStatus}`,
        type: 'order',
        createdAt: Date.now(),
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

// @desc    Delete an order (admin) - cleans up related references and reviews
// @route   DELETE /api/orders/:id
// @access  Private/Admin
exports.deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const orderId = order._id;
    const userId = order.user;

    // Remove reviews linked to this order (recompute product ratings)
    const reviews = await Review.find({ order: orderId }).select('product');
    await Review.deleteMany({ order: orderId });
    for (const r of reviews) {
      if (r.product) {
        const stats = await Review.aggregate([
          { $match: { product: r.product, isApproved: true } },
          { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
        ]);
        await Product.findByIdAndUpdate(r.product, {
          'rating.average': stats.length ? stats[0].avgRating : 0,
          'rating.count': stats.length ? stats[0].count : 0,
        });
      }
    }

    // Delete order-linked messages and conversations
    await Message.deleteMany({ order: orderId });
    await Conversation.deleteMany({ order: orderId });

    // Remove the order from the user's orderHistory
    if (userId) {
      await User.updateOne({ _id: userId }, { $pull: { orderHistory: orderId } });
    }

    await order.deleteOne();

    res.status(200).json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel order (customer)
// @route   PUT /api/orders/:id/cancel
// @access  Private/Customer
exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check if the order belongs to the authenticated user
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to cancel this order' });
    }

    // Check if order can be cancelled (only pending or confirmed orders)
    const cancellableStatuses = ['pending', 'confirmed'];
    if (!cancellableStatuses.includes(order.orderStatus)) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot cancel order with status: ${order.orderStatus}. Only pending or confirmed orders can be cancelled.` 
      });
    }

    // Update order status to cancelled
    order.orderStatus = 'cancelled';
    order.statusHistory.push({
      status: 'cancelled',
      note: 'Order cancelled by customer',
      updatedBy: req.user.id,
    });

    await order.save();

    try {
      const Delivery = require('../Models/Delivery');
      await Delivery.findOneAndUpdate(
        { orderId: order._id },
        { status: 'cancelled', notes: 'Order cancelled by customer' }
      );
    } catch (deliveryErr) {
      console.error('Delivery cancellation failed:', deliveryErr.message);
    }

    // Restore stock for the cancelled order items
    const { restoreStock } = require('../services/stockService');
    const stockItems = order.items.map((item) => ({
      product: item.product,
      quantity: item.quantity,
      variantSku: item.variantSku,
    }));
    await restoreStock(stockItems);

    // Emit socket event for real-time update
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
      }
    } catch (socketErr) {
      console.error('Order socket emit failed:', socketErr.message);
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

