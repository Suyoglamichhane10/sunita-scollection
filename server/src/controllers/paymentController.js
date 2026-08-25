const Order = require('../Models/Order');
const User = require('../Models/User');
const crypto = require('crypto');
const Stripe = require('stripe');
const { finalizePaidOrder, failOrder } = require('../services/orderFinalizeService');
const { getEsewaConfig } = require('../config/esewa');
const { getFonepayConfig } = require('../config/fonepay');

const stripe = process.env.STRIPE_SECRET_KEY ? Stripe(process.env.STRIPE_SECRET_KEY) : null;

const DEFAULT_FRONTEND_URL = 'http://localhost:5173';

/**
 * Validate the Khalti secret key. Real Khalti secret keys are ~32-char hex
 * strings. Placeholder/too-short keys cause the gateway to reject requests
 * with "Authentication credentials were not provided", so fail fast with a
 * clear, actionable message instead.
 * @param {string} secretKey
 * @returns {boolean}
 */
const isValidKhaltiSecret = (secretKey) => {
  if (!secretKey || typeof secretKey !== 'string') return false;
  const trimmed = secretKey.trim();
  // Reject the documented placeholder and keys that are clearly not real
  // (real Khalti keys are 32 hex chars). Allow a small tolerance for variant
  // dev keys but never accept obvious placeholders.
  if (/^your[_ ]?secret[_ ]?key/i.test(trimmed)) return false;
  if (trimmed.length < 32) return false;
  return true;
};

/**
 * Resolve the Khalti base URL based on KHALTI_ENV.
 * @returns {{ baseUrl: string, isLive: boolean }}
 */
const getKhaltiConfig = () => {
  const isLive = process.env.KHALTI_ENV !== 'test';
  const baseUrl = process.env.KHALTI_BASE_URL || (isLive ? 'http://khalti.com/api/v2' : 'https://dev.khalti.com/api/v2');
  return { baseUrl, isLive };
};

/**
 * Helper: compute eSewa HMAC-SHA256 signature.
 * The message must be the signed_field_names values joined by commas.
 * @param {string} secretKey
 * @param {string} message - e.g. "tAmt=1000,transaction_uuid=...,pid=..."
 * @returns {string} base64 encoded signature
 */
const esewaSign = (secretKey, message) => {
  return crypto.createHmac('sha256', secretKey).update(message).digest('base64');
};

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

    const config = getEsewaConfig();
    if (!config.merchantId || !config.productCode || !config.secretKey) {
      return res.status(503).json({
        success: false,
        message: 'eSewa is not configured on the server (missing merchant ID, product code, or secret key)',
      });
    }

    // Breakdown: total = amount(product subtotal) + tax_amount + product_delivery_charge
    // plus product_service_charge (set to 0).
    const amount = Math.round(order.subtotal || order.totalAmount);
    const taxAmount = Math.round(order.tax || 0);
    const deliveryCharge = Math.round(order.shippingCost || 0);
    const serviceCharge = 0;
    const totalAmount = amount + taxAmount + deliveryCharge + serviceCharge;

    // transaction_uuid must be unique per payment attempt.
    const transactionUuid = `${order.orderNumber}-${Date.now()}`;
    const productCode = config.productCode;

    // Register which fields we will sign. The form will be POSTed as a whole;
    // eSewa re-verifies the signature using these named fields.
    const signedFields = 'total_amount,transaction_uuid,product_code';
    const signatureMessage = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
    const signature = esewaSign(config.secretKey, signatureMessage);

    const frontendUrl = process.env.FRONTEND_URL || DEFAULT_FRONTEND_URL;
    const successUrl = `${frontendUrl}/order-success/${order._id}`;
    const failureUrl = `${frontendUrl}/payment-failure/${order._id}`;

    order.paymentDetails = { paymentId: transactionUuid, gateway: 'esewa' };
    await order.save();

    res.status(200).json({
      success: true,
      data: {
        paymentUrl: config.apiUrl,
        params: {
          amount: String(amount),
          tax_amount: String(taxAmount),
          total_amount: String(totalAmount),
          transaction_uuid: transactionUuid,
          product_code: productCode,
          product_service_charge: String(serviceCharge),
          product_delivery_charge: String(deliveryCharge),
          success_url: successUrl,
          failure_url: failureUrl,
          signed_field_names: signedFields,
          signature,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
// eSewa ID: 9711111111/9711111112/9711111113/9711111114
// Password: Nepal@123 MPIN: 1122 (for application only)
// Token:123456



// @desc    Verify eSewa payment
// @route   POST /api/payments/esewa/verify
// @access  Private
exports.verifyEsewa = async (req, res, next) => {
  try {
    const { orderId, transactionUuid, refId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    // This endpoint is public (gateway callback). When a user IS present,
    // enforce ownership; otherwise skip the check (the transaction reference
    // match below still provides validation).
    if (req.user && order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Already verified / double callback guard
    if (order.isPaid && order.orderStatus === 'confirmed') {
      return res.status(200).json({
        success: true,
        message: 'Payment already verified',
        order,
      });
    }

    if (!transactionUuid || order.paymentDetails?.paymentId !== transactionUuid) {
      await failOrder(order, 'Invalid eSewa transaction reference');
      return res.status(400).json({ success: false, message: 'Invalid eSewa transaction reference' });
    }

    const config = getEsewaConfig();
    if (!config.secretKey || !config.productCode) {
      return res.status(503).json({ success: false, message: 'eSewa is not configured on the server' });
    }

    // Query eSewa gateway for the authoritative status.
    const expectedTotal = Math.round(order.totalAmount);
    const params = new URLSearchParams({
      product_code: config.productCode,
      total_amount: String(expectedTotal),
      transaction_uuid: transactionUuid,
    });

    let gatewayData;
    let gatewayResponse;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout
      gatewayResponse = await fetch(`${config.verifyUrl}?${params.toString()}`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      gatewayData = await gatewayResponse.json();
    } catch (fetchErr) {
      return res.status(504).json({
        success: false,
        message: 'eSewa verification timed out or could not reach the gateway',
      });
    }

    if (gatewayData.status !== 'COMPLETE') {
      await failOrder(order, `eSewa payment status: ${gatewayData.status || 'NOT FOUND'}`);
      return res.status(409).json({
        success: false,
        message: 'eSewa payment is not confirmed',
        status: gatewayData.status,
      });
    }

    const finalOrder = await finalizePaidOrder(
      order,
      {
        transactionId: gatewayData.ref_id || refId || transactionUuid,
        paymentId: transactionUuid,
        paymentDate: new Date(),
        gateway: 'esewa',
      },
      order.user
    );

    res.status(200).json({ success: true, message: 'Payment verified successfully', order: finalOrder });
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

    const secretKey = process.env.KHALTI_SECRET_KEY;
    if (!isValidKhaltiSecret(secretKey)) {
      return res.status(503).json({
        success: false,
        message:
          'Khalti is not configured on the server. KHALTI_SECRET_KEY is missing or invalid ' +
          '(a real Khalti test secret key is a 32-character hex string found in the Khalti ' +
          'merchant dashboard under Settings > API Keys). Replace the placeholder value in server/.env and restart.',
      });
    }

    const { baseUrl } = getKhaltiConfig();
    const gatewayUrl = `${baseUrl}/epayment/initiate/`;

    const frontendUrl = process.env.FRONTEND_URL || DEFAULT_FRONTEND_URL;
    const returnUrl = `${frontendUrl}/order-success/${order._id}`;
    const websiteUrl = frontendUrl;
    const customer = await User.findById(order.user);

    const payload = {
      return_url: returnUrl,
      website_url: websiteUrl,
      amount: Math.round(order.totalAmount * 100), // paisa
      purchase_order_id: order.orderNumber,
      purchase_order_name: "Sunita'z Collection Order",
      customer_info: {
        name: customer?.name || 'Customer',
        email: customer?.email || '',
        phone: customer?.phone || '',
      },
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let gatewayData;
    let gatewayResponse;
    try {
      gatewayResponse = await fetch(gatewayUrl, {
        method: 'POST',
        headers: { Authorization: `Key ${secretKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      gatewayData = await gatewayResponse.json();
    } catch (fetchErr) {
      clearTimeout(timeout);
      return res.status(504).json({ success: false, message: 'Khalti initiation timed out or could not reach the gateway' });
    }
    clearTimeout(timeout);

    if (!gatewayResponse.ok || !gatewayData.payment_url) {
      return res.status(502).json({
        success: false,
        message: gatewayData?.detail || gatewayData?.message || 'Unable to start Khalti payment',
      });
    }

    order.paymentDetails = { paymentId: gatewayData.pidx, gateway: 'khalti' };
    await order.save();

    res.status(200).json({
      success: true,
      data: { paymentUrl: gatewayData.payment_url, pidx: gatewayData.pidx },
    });
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
    // This endpoint is public (gateway callback). When a user IS present,
    // enforce ownership; otherwise skip the check (the transaction reference
    // match below still provides validation).
    if (req.user && order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (order.isPaid && order.orderStatus === 'confirmed') {
      return res.status(200).json({ success: true, message: 'Payment already verified', order });
    }

    const secretKey = process.env.KHALTI_SECRET_KEY;
    if (!pidx || order.paymentDetails?.paymentId !== pidx || !isValidKhaltiSecret(secretKey)) {
      await failOrder(order, 'Invalid Khalti verification request');
      return res.status(400).json({ success: false, message: 'Invalid Khalti verification request' });
    }

    const { baseUrl } = getKhaltiConfig();
    const gatewayUrl = `${baseUrl}/epayment/lookup/`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let gatewayData;
    let gatewayResponse;
    try {
      gatewayResponse = await fetch(gatewayUrl, {
        method: 'POST',
        headers: { Authorization: `Key ${secretKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ pidx }),
        signal: controller.signal,
      });
      gatewayData = await gatewayResponse.json();
    } catch (fetchErr) {
      clearTimeout(timeout);
      return res.status(504).json({ success: false, message: 'Khalti verification timed out or could not reach the gateway' });
    }
    clearTimeout(timeout);

    if (!gatewayResponse.ok || gatewayData.status !== 'Completed') {
      await failOrder(order, `Khalti payment status: ${gatewayData.status || 'NOT COMPLETED'}`);
      return res.status(409).json({
        success: false,
        message: 'Khalti payment is not confirmed',
        status: gatewayData.status,
      });
    }

    // Amount in paisa must match the order total.
    if (gatewayData.total_amount !== Math.round(order.totalAmount * 100)) {
      await failOrder(order, 'Khalti payment amount mismatch');
      return res.status(409).json({ success: false, message: 'Khalti payment amount mismatch' });
    }

    const finalOrder = await finalizePaidOrder(
      order,
      {
        transactionId: gatewayData.transaction_id,
        paymentId: pidx,
        paymentDate: new Date(),
        gateway: 'khalti',
      },
      order.user
    );

    res.status(200).json({ success: true, message: 'Payment verified successfully', order: finalOrder });
  } catch (error) {
    next(error);
  }
};

// @desc    Get eSewa payment status by transaction ID
// @route   GET /api/payments/esewa/status/:transactionId
// @access  Private
exports.getEsewaStatus = async (req, res, next) => {
  try {
    const { transactionId } = req.params;
    const config = getEsewaConfig();

    if (!config.secretKey || !config.productCode) {
      return res.status(503).json({ success: false, message: 'eSewa is not configured on the server' });
    }

    // Query eSewa gateway for transaction status
    const params = new URLSearchParams({
      product_code: config.productCode,
      transaction_uuid: transactionId,
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let gatewayResponse;
    try {
      gatewayResponse = await fetch(`${config.verifyUrl}?${params.toString()}`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
    } catch (fetchErr) {
      clearTimeout(timeout);
      return res.status(504).json({
        success: false,
        message: 'eSewa status check timed out or could not reach the gateway',
      });
    }

    const gatewayData = await gatewayResponse.json();

    res.status(200).json({
      success: true,
      status: gatewayData.status,
      transactionId: gatewayData.transaction_id,
      refId: gatewayData.ref_id,
      amount: gatewayData.total_amount,
      message: gatewayData.message || 'Status retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    eSewa success callback (public endpoint)
// @route   GET /api/payments/esewa/success
// @access  Public
exports.esewaSuccess = async (req, res, next) => {
  try {
    const { oid, refId, transaction_uuid } = req.query;

    if (!oid || !transaction_uuid) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-failure/${oid || 'unknown'}?error=missing_params`);
    }

    const order = await Order.findById(oid);
    if (!order) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-failure/${oid}?error=order_not_found`);
    }

    // Already verified - redirect to success
    if (order.isPaid && order.orderStatus === 'confirmed') {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/order-success/${oid}`);
    }

    const config = getEsewaConfig();
    if (!config.secretKey || !config.productCode) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-failure/${oid}?error=not_configured`);
    }

    // Verify payment with eSewa
    const expectedTotal = Math.round(order.totalAmount);
    const params = new URLSearchParams({
      product_code: config.productCode,
      total_amount: String(expectedTotal),
      transaction_uuid: transaction_uuid,
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let gatewayResponse;
    try {
      gatewayResponse = await fetch(`${config.verifyUrl}?${params.toString()}`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
    } catch (fetchErr) {
      clearTimeout(timeout);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-failure/${oid}?error=verification_timeout`);
    }

    const gatewayData = await gatewayResponse.json();

    if (gatewayData.status !== 'COMPLETE') {
      await failOrder(order, `eSewa payment status: ${gatewayData.status || 'NOT FOUND'}`);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-failure/${oid}?error=payment_not_complete`);
    }

    // Finalize the order
    await finalizePaidOrder(
      order,
      {
        transactionId: gatewayData.ref_id || refId || transaction_uuid,
        paymentId: transaction_uuid,
        paymentDate: new Date(),
        gateway: 'esewa',
      },
      order.user
    );

    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/order-success/${oid}`);
  } catch (error) {
    console.error('eSewa success callback error:', error);
    const oid = req.query.oid || 'unknown';
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-failure/${oid}?error=server_error`);
  }
};

// @desc    eSewa failure callback (public endpoint)
// @route   GET /api/payments/esewa/failure
// @access  Public
exports.esewaFailure = async (req, res, next) => {
  try {
    const { oid } = req.query;

    if (oid) {
      const order = await Order.findById(oid);
      if (order && !order.isPaid) {
        await failOrder(order, 'eSewa payment cancelled or failed by user');
      }
    }

    const failureUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-failure/${oid || 'unknown'}`;
    res.redirect(failureUrl);
  } catch (error) {
    console.error('eSewa failure callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-failure?error=server_error`);
  }
};

// @desc    FonePay success callback (public endpoint)
// @route   GET /api/payments/fonepay/success
// @access  Public
exports.fonepaySuccess = async (req, res, next) => {
  try {
    const { oid, transaction_uuid, refId } = req.query;

    if (!oid || !transaction_uuid) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-failure/${oid || 'unknown'}?error=missing_params`);
    }

    const order = await Order.findById(oid);
    if (!order) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-failure/${oid}?error=order_not_found`);
    }

    if (order.isPaid && order.orderStatus === 'confirmed') {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/order-success/${oid}`);
    }

    const config = getFonepayConfig();
    if (!config.merchantId || !config.merchantSecret || !config.appId) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-failure/${oid}?error=not_configured`);
    }

    const expectedTotal = Math.round(order.totalAmount);
    const lookupPayload = {
      merchant_id: config.merchantId,
      app_id: config.appId,
      transaction_uuid,
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let gatewayResponse;
    try {
      gatewayResponse = await fetch(`${config.baseUrl}ipn/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lookupPayload),
        signal: controller.signal,
      });
      clearTimeout(timeout);
    } catch (fetchErr) {
      clearTimeout(timeout);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-failure/${oid}?error=verification_timeout`);
    }

    let gatewayData;
    try {
      gatewayData = await gatewayResponse.json();
    } catch {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-failure/${oid}?error=invalid_response`);
    }

    const isSuccess = gatewayData.status === 'SUCCESS' || gatewayData.status === 'COMPLETE' || gatewayData.response_code === '00' || gatewayData.response_code === '0';
    if (!isSuccess) {
      await failOrder(order, `FonePay payment status: ${gatewayData.status || gatewayData.response_code || 'NOT FOUND'}`);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-failure/${oid}?error=payment_not_complete`);
    }

    await finalizePaidOrder(
      order,
      {
        transactionId: gatewayData.transaction_id || refId || transaction_uuid,
        paymentId: transaction_uuid,
        paymentDate: new Date(),
        gateway: 'fonepay',
      },
      order.user
    );

    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/order-success/${oid}`);
  } catch (error) {
    console.error('FonePay success callback error:', error);
    const oid = req.query.oid || 'unknown';
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-failure/${oid}?error=server_error`);
  }
};

// @desc    FonePay failure callback (public endpoint)
// @route   GET /api/payments/fonepay/failure
// @access  Public
exports.fonepayFailure = async (req, res, next) => {
  try {
    const { oid } = req.query;

    if (oid) {
      const order = await Order.findById(oid);
      if (order && !order.isPaid) {
        await failOrder(order, 'FonePay payment cancelled or failed by user');
      }
    }

    const failureUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-failure/${oid || 'unknown'}`;
    res.redirect(failureUrl);
  } catch (error) {
    console.error('FonePay failure callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-failure?error=server_error`);
  }
};

const isValidFonepayConfig = (config) => {
  if (!config.merchantId || !config.merchantSecret || !config.appId) return false;
  if (/your[_ ]?merchant[_ ]?id/i.test(config.merchantId)) return false;
  if (/your[_ ]?merchant[_ ]?secret/i.test(config.merchantSecret)) return false;
  if (/your[_ ]?app[_ ]?id/i.test(config.appId)) return false;
  return true;
};

// @desc    Initiate FonePay payment
// @route   POST /api/payments/fonepay/initiate
// @access  Private
exports.initiateFonepay = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const config = getFonepayConfig();
    if (!isValidFonepayConfig(config)) {
      return res.status(503).json({
        success: false,
        message: 'FonePay is not configured on the server (missing merchant ID, secret, or app ID). Replace the placeholder values in server/.env and restart.',
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || DEFAULT_FRONTEND_URL;
    const successUrl = `${frontendUrl}/order-success/${order._id}`;
    const failureUrl = `${frontendUrl}/payment-failure/${order._id}`;

    const transactionUuid = `${order.orderNumber}-${Date.now()}`;
    const amount = Math.round(order.totalAmount);

    const payload = {
      merchant_id: config.merchantId,
      app_id: config.appId,
      amount: String(amount),
      transaction_uuid: transactionUuid,
      product_code: 'SunitaCollection',
      return_url: successUrl,
      failure_url: failureUrl,
      customer_info: {
        name: order.shippingAddress?.fullName || 'Customer',
        email: '',
        phone: order.shippingAddress?.phone || '',
      },
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    let gatewayData;
    let gatewayResponse;
    try {
      gatewayResponse = await fetch(`${config.baseUrl}ipn/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      gatewayData = await gatewayResponse.json();
    } catch (fetchErr) {
      clearTimeout(timeout);
      return res.status(504).json({ success: false, message: 'FonePay initiation timed out or could not reach the gateway' });
    }
    clearTimeout(timeout);

    const paymentUrl = gatewayData.payment_url || gatewayData.redirect_url || gatewayData.url;
    if (!gatewayResponse.ok || !paymentUrl) {
      return res.status(502).json({
        success: false,
        message: gatewayData?.message || gatewayData?.detail || 'Unable to start FonePay payment',
      });
    }

    order.paymentDetails = { paymentId: transactionUuid, gateway: 'fonepay' };
    await order.save();

    res.status(200).json({
      success: true,
      data: { paymentUrl, transactionUuid },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify FonePay payment
// @route   POST /api/payments/fonepay/verify
// @access  Private
exports.verifyFonepay = async (req, res, next) => {
  try {
    const { orderId, transactionUuid } = req.body;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (req.user && order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (order.isPaid && order.orderStatus === 'confirmed') {
      return res.status(200).json({ success: true, message: 'Payment already verified', order });
    }

    if (!transactionUuid || order.paymentDetails?.paymentId !== transactionUuid) {
      await failOrder(order, 'Invalid FonePay transaction reference');
      return res.status(400).json({ success: false, message: 'Invalid FonePay transaction reference' });
    }

    const config = getFonepayConfig();
    if (!config.merchantId || !config.merchantSecret || !config.appId) {
      return res.status(503).json({ success: false, message: 'FonePay is not configured on the server' });
    }

    const lookupPayload = {
      merchant_id: config.merchantId,
      app_id: config.appId,
      transaction_uuid,
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let gatewayResponse;
    try {
      gatewayResponse = await fetch(`${config.baseUrl}ipn/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lookupPayload),
        signal: controller.signal,
      });
    } catch (fetchErr) {
      clearTimeout(timeout);
      return res.status(504).json({ success: false, message: 'FonePay verification timed out or could not reach the gateway' });
    }
    clearTimeout(timeout);

    let gatewayData;
    try {
      gatewayData = await gatewayResponse.json();
    } catch {
      return res.status(502).json({ success: false, message: 'Invalid response from FonePay gateway' });
    }

    const isSuccess = gatewayData.status === 'SUCCESS' || gatewayData.status === 'COMPLETE' || gatewayData.response_code === '00' || gatewayData.response_code === '0';
    if (!gatewayResponse.ok || !isSuccess) {
      await failOrder(order, `FonePay payment status: ${gatewayData.status || gatewayData.response_code || 'NOT COMPLETED'}`);
      return res.status(409).json({
        success: false,
        message: 'FonePay payment is not confirmed',
        status: gatewayData.status,
      });
    }

    const finalOrder = await finalizePaidOrder(
      order,
      {
        transactionId: gatewayData.transaction_id || transactionUuid,
        paymentId: transactionUuid,
        paymentDate: new Date(),
        gateway: 'fonepay',
      },
      order.user
    );

    res.status(200).json({ success: true, message: 'Payment verified successfully', order: finalOrder });
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
      orderStatus: order.orderStatus,
      isPaid: order.isPaid,
      paymentDetails: order.paymentDetails,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Handle Stripe webhook events (authoritative payment confirmation)
// @route   POST /api/payments/stripe/webhook
// @access  Public (verified via Stripe signature)
exports.stripeWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripe || !webhookSecret) {
      return res.status(503).json({ success: false, message: 'Stripe webhook is not configured' });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    } catch (err) {
      return res.status(400).json({ success: false, message: `Webhook signature verification failed: ${err.message}` });
    }

    // Only handle the checkout session completed event.
    if (event.type !== 'checkout.session.completed') {
      return res.status(200).json({ received: true });
    }

    const session = event.data.object;
    const orderId = session.metadata && session.metadata.orderId;
    if (!orderId) {
      return res.status(200).json({ received: true });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Double-callback guard: do not finalize twice.
    if (order.isPaid && order.orderStatus === 'confirmed') {
      return res.status(200).json({ received: true, alreadyVerified: true });
    }

    const finalOrder = await finalizePaidOrder(
      order,
      {
        transactionId: session.payment_intent || session.id,
        paymentId: session.id,
        paymentDate: new Date(),
        gateway: 'stripe',
      },
      order.user
    );

    res.status(200).json({ received: true, orderId: finalOrder._id });
  } catch (error) {
    next(error);
  }
};