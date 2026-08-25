const express = require('express');
const router = express.Router();
const {
  initiateEsewa,
  verifyEsewa,
  esewaSuccess,
  esewaFailure,
  getEsewaStatus,
  initiateKhalti,
  verifyKhalti,
  initiateFonepay,
  verifyFonepay,
  fonepaySuccess,
  fonepayFailure,
  getPaymentStatus,
  stripeWebhook,
} = require('../controllers/paymentController');
const { protect } = require('../Middleware/auth');

// Public callback endpoints for eSewa.
// These are hit when eSewa redirects the browser back after payment.
// They are intentionally NOT behind `protect` because the gateway redirect does not carry a JWT.
router.get('/esewa/success', esewaSuccess);
router.get('/esewa/failure', esewaFailure);

// Public callback endpoints for FonePay.
router.get('/fonepay/success', fonepaySuccess);
router.get('/fonepay/failure', fonepayFailure);

// Public callback verification endpoints.
// These are hit when the payment gateway redirects the browser back to the
// success page. The order is looked up via the orderId in the URL and the
// transaction reference is validated. They are intentionally NOT behind
// `protect` because the gateway redirect does not carry a JWT.
router.post('/esewa/verify', verifyEsewa);
router.post('/khalti/verify', verifyKhalti);
router.post('/fonepay/verify', verifyFonepay);

// Stripe webhook (public, verified via Stripe signature).
// NOTE: This route is mounted with a raw body parser in app.js so that
// stripe.webhooks.constructEvent can verify the request signature.
router.post('/stripe/webhook', stripeWebhook);

// Everything below requires authentication.
router.use(protect);

router.post('/esewa/initiate', initiateEsewa);
router.post('/khalti/initiate', initiateKhalti);
router.post('/fonepay/initiate', initiateFonepay);
router.get('/esewa/status/:transactionId', getEsewaStatus);
router.get('/status/:orderId', getPaymentStatus);

module.exports = router;
