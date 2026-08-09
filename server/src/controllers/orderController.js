const Order = require('../Models/Order');
const Product = require('../Models/Product');
const User = require('../Models/User');
const Stripe = require('stripe');
const { sendOrderConfirmation } = require('../services/emailService');
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

    const products = await Product.find({ _id: { $in: items.map((item) => item.productId) } });

    const lineItems = items.map((item) => {
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

    await User.findByIdAndUpdate(req.user.id, { $push: { orderHistory: order._id } });

    for (const li of lineItems) {
      const product = await Product.findById(li.product);
      if (!product) continue;
      if (li.variantSku && product.variants && product.variants.length) {
        const vIdx = product.variants.findIndex(
          (v) => (v.sku && v.sku === li.variantSku) || (v._id && v._id.toString() === li.variantSku)
        );
        if (vIdx !== -1) {
          product.variants[vIdx].stock = Math.max(0, (product.variants[vIdx].stock || 0) - li.quantity);
        } else {
          product.stock = Math.max(0, (product.stock || 0) - li.quantity);
        }
      } else {
        product.stock = Math.max(0, (product.stock || 0) - li.quantity);
      }
      product.soldCount = (product.soldCount || 0) + li.quantity;
      await product.save();
    }

    if (paymentMethod === 'stripe') {
      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({
          success: false,
          message: 'Stripe API key not configured on server',
        });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
line_items: lineItems.map((item) => ({
          price_data: {
            currency: 'npr',
            product_data: {
              name: item.name,
              images: item.image ? [item.image] : [],
            },
            unit_amount: Math.round(item.price * 100),
          },
          quantity: item.quantity,
        })),
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/cart`,
        metadata: {
          orderId: order._id.toString(),
        },
      });

return res.status(201).json({
        success: true,
        order,
        checkoutUrl: session.url,
      });
    }

// Send order confirmation email (non-blocking)
    try {
      const user = await User.findById(req.user.id);
      if (user) {
        sendOrderConfirmation(user, order);
      }
    } catch (emailErr) {
      console.error('Email send failed:', emailErr.message);
    }

    res.status(201).json({ success: true, order });

    // Award loyalty points & trigger automation (non-blocking, after response)
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
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
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

