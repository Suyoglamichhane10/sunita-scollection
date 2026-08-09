/**
 * webhookService.js
 * Handles inbound webhook events from Facebook, Instagram, WhatsApp, and TikTok.
 * It normalizes platform payloads into the unified Message model and notifies
 * admins via Socket.IO so the unified inbox updates in real-time.
 */

const Message = require('../Models/Message');
const Conversation = require('../Models/Conversation');

/**
 * Verify a Facebook/Instagram webhook subscription (GET challenge).
 */
function verifyFacebookWebhook(query) {
  const mode = query['hub.mode'];
  const token = query['hub.verify_token'];
  const challenge = query['hub.challenge'];
  const verifyToken = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN || 'sunitastoken';
  if (mode === 'subscribe' && token === verifyToken) {
    return challenge;
  }
  return null;
}

/**
 * Normalize + persist an inbound Facebook/Instagram message.
 */
async function handleFacebookInbound(payload) {
  const entry = payload.entry && payload.entry[0];
  const messaging = entry && entry.messaging && entry.messaging[0];
  if (!messaging || !messaging.message) return null;

  const senderId = messaging.sender && messaging.sender.id;
  const text = messaging.message.text || '';
  const source = payload.object === 'instagram' ? 'instagram' : 'facebook';
  const senderName = messaging.sender && (messaging.sender.name || 'Platform User');

  return await createInboundMessage({ source, senderId, senderName, text });
}

/**
 * Normalize + persist an inbound WhatsApp message.
 */
async function handleWhatsAppInbound(payload) {
  const entry = payload.entry && payload.entry[0];
  const changes = entry && entry.changes;
  const change = changes && changes[0];
  const value = change && change.value;
  const messages = value && value.messages;
  if (!messages || !messages[0]) return null;

  const msg = messages[0];
  const text = msg.text ? msg.text.body : '';
  const senderPhone = msg.from;

  return await createInboundMessage({
    source: 'whatsapp',
    senderId: senderPhone,
    senderName: senderPhone,
    text,
  });
}

/**
 * Normalize + persist an inbound TikTok message.
 */
async function handleTikTokInbound(payload) {
  const sender = payload.sender || {};
  const content = payload.content || {};
  const text = content.text || '';

  return await createInboundMessage({
    source: 'tiktok',
    senderId: sender.open_id || sender.id,
    senderName: sender.display_name || 'TikTok User',
    text,
  });
}

/**
 * Shared helper: persist a normalized inbound platform message, create/attach
 * a conversation, and emit a Socket.IO event to admins.
 */
async function createInboundMessage({ source, senderId, senderName, text }) {
  if (!senderId || !text) return null;

  // Find or create a conversation keyed by platform sender id.
  let conversation = await Conversation.findOne({
    type: 'support',
    title: `${source}:${senderId}`,
  });

  if (!conversation) {
    conversation = await Conversation.create({
      type: 'support',
      title: `${source}:${senderId}`,
      customerName: senderName,
      status: 'open',
      lastMessageAt: Date.now(),
    });
  }

  const message = await Message.create({
    conversation: conversation._id,
    source,
    senderName,
    message: text,
    messageType: 'text',
    status: 'new',
    platformSenderId: senderId,
  });

  conversation.lastMessageAt = Date.now();
  conversation.lastMessagePreview = text.slice(0, 80);
  conversation.unreadCount = (conversation.unreadCount || 0) + 1;
  await conversation.save();

  return { message, conversation };
}

module.exports = {
  verifyFacebookWebhook,
  handleFacebookInbound,
  handleWhatsAppInbound,
  handleTikTokInbound,
  createInboundMessage,
};
