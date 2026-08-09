const webhookService = require('../services/webhookService');
const { sendPlatformReply } = require('../services/socialMediaService');

/**
 * Facebook / Instagram webhook verification (checks the hub.challenge).
 * @route GET /api/messages/webhook/facebook
 */
exports.verifyFacebook = (req, res) => {
  const challenge = webhookService.verifyFacebookWebhook(req.query);
  if (challenge) {
    return res.status(200).send(challenge);
  }
  return res.status(403).send('Verification failed');
};

/**
 * Facebook / Instagram inbound message handler.
 * @route POST /api/messages/webhook/facebook
 */
exports.facebookWebhook = async (req, res, next) => {
  try {
    const result = await webhookService.handleFacebookInbound(req.body);
    if (result) {
      const io = req.app.get('io');
      if (io) io.to('admins').emit('message:created', result.message);
    }
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

/**
 * WhatsApp inbound message handler.
 * @route POST /api/messages/webhook/whatsapp
 */
exports.whatsappWebhook = async (req, res, next) => {
  try {
    const result = await webhookService.handleWhatsAppInbound(req.body);
    if (result) {
      const io = req.app.get('io');
      if (io) io.to('admins').emit('message:created', result.message);
    }
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

/**
 * TikTok inbound message handler.
 * @route POST /api/messages/webhook/tiktok
 */
exports.tiktokWebhook = async (req, res, next) => {
  try {
    const result = await webhookService.handleTikTokInbound(req.body);
    if (result) {
      const io = req.app.get('io');
      if (io) io.to('admins').emit('message:created', result.message);
    }
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};
