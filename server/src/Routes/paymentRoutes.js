const express = require('express');
const router = express.Router();
const {
  initiateEsewa,
  verifyEsewa,
  getEsewaStatus,
  esewaSuccess,
  esewaFailure,
  initiateFonepay,
  verifyFonepay,
  fonepaySuccess,
  fonepayFailure,
  getPaymentStatus,
  stripeWebhook,
} = require('../controllers/paymentController');
const { protect } = require('../Middleware/auth');

router.post('/esewa/initiate', protect, initiateEsewa);
router.post('/esewa/verify', protect, verifyEsewa);
router.get('/esewa/status/:transactionId', protect, getEsewaStatus);
router.get('/esewa/success', esewaSuccess);
router.get('/esewa/failure', esewaFailure);

router.post('/fonepay/initiate', protect, initiateFonepay);
router.post('/fonepay/verify', protect, verifyFonepay);
router.get('/fonepay/success', fonepaySuccess);
router.get('/fonepay/failure', fonepayFailure);

router.get('/status/:orderId', protect, getPaymentStatus);
router.post('/stripe/webhook', stripeWebhook);

module.exports = router;
