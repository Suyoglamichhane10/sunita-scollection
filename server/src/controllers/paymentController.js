const Order = require('../Models/Order');
const crypto = require('crypto');

// @desc    Initiate eSewa payment
// @route   POST /api/payments/esewa/initiate
// @access  Private
exports.initiateEsewa = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

// eSewa breaks down the amount: total = amount + tax + delivery + service.
    // `amount` here is the product subtotal (excludes tax/shipping) so that
    // total_amount = amount + tax_amount + product_delivery_charge matches
    // the server-side order total. This keeps the values consistent for eSewa.
    const amount = order.subtotal || order.totalAmount;
    const taxAmount = order.tax || 0;
    const deliveryCharge = order.shippingCost || 0;
    const totalAmount = Math.round(amount + taxAmount + deliveryCharge);
    const productCode = process.env.ESEWA_PRODUCT_CODE || 'EPAYTEST';
    const transactionUuid = `${order.orderNumber}-${Date.now()}`;
    const secretKey = process.env.ESEWA_SECRET_KEY || '';
    const successUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/order-success/${order._id}`;
    const failureUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout`;

    // eSewa signature: total_amount, transaction_uuid, product_code
    // In test mode, signature is optional; for production compute HMAC-SHA256
    let signature = '';
    if (secretKey) {
      const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
      signature = crypto.createHmac('sha256', secretKey).update(message).digest('base64');
    }

    order.paymentDetails = { paymentId: transactionUuid };
    await order.save();

    res.status(200).json({
      success: true,
      data: {
        paymentUrl: process.env.ESEWA_URL || 'https://rc-epay.esewa.com.np/api/epay/main/v2/form',
        params: {
          amount: Math.round(amount),
          tax_amount: Math.round(taxAmount),
          total_amount: Math.round(totalAmount),
          transaction_uuid: transactionUuid,
          product_code: productCode,
product_service_charge: '0',
          product_delivery_charge: String(Math.round(deliveryCharge)),
          success_url: successUrl,
          failure_url: failureUrl,
          signed_field_names: 'total_amount,transaction_uuid,product_code',
          signature,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify eSewa payment
// @route   POST /api/payments/esewa/verify
// @access  Private
exports.verifyEsewa = async (req, res, next) => {
  try {
    const { orderId, transactionUuid } = req.body;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (!transactionUuid || order.paymentDetails?.paymentId !== transactionUuid) {
      return res.status(400).json({ success: false, message: 'Invalid eSewa transaction reference' });
    }
    const statusUrl = process.env.ESEWA_STATUS_URL || 'https://rc.esewa.com.np/api/epay/transaction/status/';
    const query = new URLSearchParams({
      product_code: process.env.ESEWA_PRODUCT_CODE || 'EPAYTEST',
      total_amount: String(Math.round(order.totalAmount)),
      transaction_uuid: transactionUuid,
    });
    const gatewayResponse = await fetch(`${statusUrl}?${query.toString()}`);
    const gatewayData = await gatewayResponse.json();
    if (!gatewayResponse.ok || gatewayData.status !== 'COMPLETE') {
      return res.status(409).json({ success: false, message: 'eSewa payment is not confirmed', status: gatewayData.status });
    }

    order.paymentStatus = 'paid';
    order.isPaid = true;
    order.paidAt = new Date();
    order.paymentDetails = { transactionId: gatewayData.ref_id, paymentId: transactionUuid, paymentDate: new Date() };
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Initiate Khalti payment
// @route   POST /api/payments/khalti/initiate
// @access  Private
exports.initiateKhalti = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (!process.env.KHALTI_SECRET_KEY) {
      return res.status(503).json({ success: false, message: 'Khalti is not configured on the server' });
    }
    const returnUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/order-success/${order._id}`;
    const websiteUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const gatewayUrl = `${process.env.KHALTI_BASE_URL || 'https://dev.khalti.com/api/v2'}/epayment/initiate/`;
    const gatewayResponse = await fetch(gatewayUrl, {
      method: 'POST',
      headers: { Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        return_url: returnUrl,
        website_url: websiteUrl,
        amount: Math.round(order.totalAmount * 100),
        purchase_order_id: order.orderNumber,
        purchase_order_name: "Sunita's Collection Order",
      }),
    });
    const gatewayData = await gatewayResponse.json();
    if (!gatewayResponse.ok || !gatewayData.payment_url) {
      return res.status(502).json({ success: false, message: 'Unable to start Khalti payment' });
    }
    order.paymentDetails = { paymentId: gatewayData.pidx };
    await order.save();
    res.status(200).json({ success: true, data: { paymentUrl: gatewayData.payment_url, pidx: gatewayData.pidx } });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Khalti payment
// @route   POST /api/payments/khalti/verify
// @access  Private
exports.verifyKhalti = async (req, res, next) => {
  try {
    const { orderId, pidx } = req.body;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (!pidx || order.paymentDetails?.paymentId !== pidx || !process.env.KHALTI_SECRET_KEY) {
      return res.status(400).json({ success: false, message: 'Invalid Khalti verification request' });
    }
    const gatewayUrl = `${process.env.KHALTI_BASE_URL || 'https://dev.khalti.com/api/v2'}/epayment/lookup/`;
    const gatewayResponse = await fetch(gatewayUrl, {
      method: 'POST',
      headers: { Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ pidx }),
    });
    const gatewayData = await gatewayResponse.json();
    if (!gatewayResponse.ok || gatewayData.status !== 'Completed' || gatewayData.total_amount !== Math.round(order.totalAmount * 100)) {
      return res.status(409).json({ success: false, message: 'Khalti payment is not confirmed', status: gatewayData.status });
    }
    order.paymentStatus = 'paid';
    order.isPaid = true;
    order.paidAt = new Date();
    order.paymentDetails = {
      transactionId: gatewayData.transaction_id,
      paymentId: pidx,
      paymentDate: new Date(),
    };
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment status for an order
// @route   GET /api/payments/status/:orderId
// @access  Private
exports.getPaymentStatus = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    res.status(200).json({
      success: true,
      paymentStatus: order.paymentStatus,
      isPaid: order.isPaid,
      paymentDetails: order.paymentDetails,
    });
  } catch (error) {
    next(error);
  }
};
