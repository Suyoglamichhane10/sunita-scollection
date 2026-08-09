const express = require('express');
const router = express.Router();
const {
  verifyFacebook,
  facebookWebhook,
  whatsappWebhook,
  tiktokWebhook,
} = require('../controllers/webhookController');

// Facebook / Instagram webhook verification (GET) + inbound (POST)
router.get('/facebook', verifyFacebook);
router.post('/facebook', facebookWebhook);

// WhatsApp inbound
router.post('/whatsapp', whatsappWebhook);

// TikTok inbound
router.post('/tiktok', tiktokWebhook);

module.exports = router;
