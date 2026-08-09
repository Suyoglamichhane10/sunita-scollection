const express = require('express');
const router = express.Router();
const {
  initiateEsewa,
  verifyEsewa,
  initiateKhalti,
  verifyKhalti,
  getPaymentStatus,
} = require('../controllers/paymentController');
const { protect } = require('../Middleware/auth');

// All payment routes require authentication
router.use(protect);

router.post('/esewa/initiate', initiateEsewa);
router.post('/esewa/verify', verifyEsewa);
router.post('/khalti/initiate', initiateKhalti);
router.post('/khalti/verify', verifyKhalti);
router.get('/status/:orderId', getPaymentStatus);

module.exports = router;
