/**
 * socialMediaService.js
 * Platform connectors for Facebook, Instagram, WhatsApp, and TikTok.
 *
 * These utilities POST replies back to the originating platform when an admin
 * replies from the unified inbox. Each platform connector is guarded by its
 * env keys so the app runs cleanly even when credentials are not configured.
 *
 * Uses the native global fetch (Node 18+/20+).
 *
 * Inbound messages arrive via webhook endpoints (see webhookService.js).
 */

const FACEBOOK_GRAPH_URL = 'https://graph.facebook.com/v18.0';
const FACEBOOK_PAGE_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN || '';
const INSTAGRAM_BUSINESS_ID = process.env.INSTAGRAM_BUSINESS_ID || '';
const WHATSAPP_PHONE_NUMBER = process.env.WHATSAPP_PHONE_NUMBER || '';
const WHATSAPP_BUSINESS_TOKEN = process.env.WHATSAPP_BUSINESS_TOKEN || '';

/**
 * Send a reply to a Facebook Messenger user.
 * @param {string} recipientId - Facebook PSID of the user to message
 * @param {string} messageText - reply text
 */
async function sendFacebookReply(recipientId, messageText) {
  if (!FACEBOOK_PAGE_TOKEN) {
    throw new Error('FACEBOOK_PAGE_ACCESS_TOKEN not configured');
  }
  const url = `${FACEBOOK_GRAPH_URL}/me/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${FACEBOOK_PAGE_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text: messageText },
    }),
  });
  if (!res.ok) throw new Error(`Facebook send failed: ${res.status}`);
  return res.json();
}

/**
 * Send a reply to an Instagram DM user (via Meta Graph API).
 * @param {string} recipientId - Instagram user id
 * @param {string} messageText - reply text
 */
async function sendInstagramReply(recipientId, messageText) {
  if (!INSTAGRAM_BUSINESS_ID || !FACEBOOK_PAGE_TOKEN) {
    throw new Error('Instagram credentials not configured');
  }
  const url = `${FACEBOOK_GRAPH_URL}/${INSTAGRAM_BUSINESS_ID}/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${FACEBOOK_PAGE_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text: messageText },
    }),
  });
  if (!res.ok) throw new Error(`Instagram send failed: ${res.status}`);
  return res.json();
}

/**
 * Send a reply to a WhatsApp user via WhatsApp Business.
 * @param {string} recipientPhone - E.164 phone number
 * @param {string} messageText - reply text
 */
async function sendWhatsAppReply(recipientPhone, messageText) {
  if (!WHATSAPP_BUSINESS_TOKEN || !WHATSAPP_PHONE_NUMBER) {
    throw new Error('WhatsApp credentials not configured');
  }
  const url = `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER}/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${WHATSAPP_BUSINESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: recipientPhone,
      text: { body: messageText },
    }),
  });
  if (!res.ok) throw new Error(`WhatsApp send failed: ${res.status}`);
  return res.json();
}

/**
 * Send a reply to a TikTok DM user.
 * @param {string} recipientOpenId - TikTok user open id
 * @param {string} messageText - reply text
 * @param {string} accessToken - TikTok access token
 */
async function sendTikTokReply(recipientOpenId, messageText, accessToken) {
  if (!process.env.TIKTOK_ACCESS_TOKEN) {
    throw new Error('TIKTOK_ACCESS_TOKEN not configured');
  }
  const token = accessToken || process.env.TIKTOK_ACCESS_TOKEN;
  const url = 'https://open.tiktokapis.com/v2/message/send/';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to_user: { open_id: recipientOpenId },
      message_type: 'text',
      content: { text: messageText },
    }),
  });
  if (!res.ok) throw new Error(`TikTok send failed: ${res.status}`);
  return res.json();
}

/**
 * Route a reply to the correct platform connector.
 * @param {string} source - 'facebook' | 'instagram' | 'whatsapp' | 'tiktok'
 * @param {string} recipientId - platform recipient id
 * @param {string} messageText - reply text
 */
async function sendPlatformReply(source, recipientId, messageText) {
  switch (source) {
    case 'facebook':
      return await sendFacebookReply(recipientId, messageText);
    case 'instagram':
      return await sendInstagramReply(recipientId, messageText);
    case 'whatsapp':
      return await sendWhatsAppReply(recipientId, messageText);
    case 'tiktok':
      return await sendTikTokReply(recipientId, messageText);
    default:
      throw new Error(`Unsupported platform source: ${source}`);
  }
}

module.exports = {
  sendFacebookReply,
  sendInstagramReply,
  sendWhatsAppReply,
  sendTikTokReply,
  sendPlatformReply,
};
