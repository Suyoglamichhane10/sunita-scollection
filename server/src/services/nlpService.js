// Lightweight, self-contained NLP intent-matching service.
// Uses keyword + regex pattern matching with multilingual (Nepali + English)
// support. Designed as a swappable adapter so Dialogflow/Rasa can be
// integrated later without changing the consumer code.

const ChatbotIntent = require('../Models/ChatbotIntent');
const Order = require('../Models/Order');
const Product = require('../Models/Product');
const Gamification = require('../Models/Gamification');

// Normalize text: lowercase, strip punctuation, collapse whitespace
const normalize = (text = '') =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const detectLanguage = (text = '') => {
  const devanagari = /[\u0900-\u097F]/;
  return devanagari.test(text) ? 'ne' : 'en';
};

// Score a message against an intent's patterns
const scorePattern = (normalized, patternText) => {
  const np = normalize(patternText);
  if (!np) return 0;
  // Exact phrase match
  if (normalized === np) return 100;
  // Contains phrase
  if (normalized.includes(np)) return 80;
  // Token overlap ratio
  const tokens = np.split(' ').filter(Boolean);
  if (!tokens.length) return 0;
  let hits = 0;
  tokens.forEach((t) => {
    if (t.length > 2 && normalized.includes(t)) hits += 1;
  });
  return Math.round((hits / tokens.length) * 60);
};

const getOrderContext = async (userId) => {
  const orders = await Order.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(3)
    .select('orderNumber orderStatus totalAmount createdAt items');
  return orders;
};

const getPurchaseHistory = async (userId) => {
  const orders = await Order.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(20);
  const productIds = new Set();
  orders.forEach((o) => {
    (o.items || []).forEach((it) => productIds.add(it.product.toString()));
  });
  return Array.from(productIds);
};

const getLoyaltyContext = async (userId) => {
  const gamification = await Gamification.findOne({ user: userId });
  return gamification ? { points: gamification.points, tier: gamification.tier } : null;
};

// Build a context-aware reply for order/product/loyalty intents
const buildDynamicResponse = async ({ intent, userId, language }) => {
  try {
    if (intent === 'order_status') {
      const orders = await getOrderContext(userId);
      if (!orders.length) {
        return language === 'ne'
          ? 'तपाईंसँग हाल कुनै अर्डर छैन। कृपया हाम्रो पसलमा किनमेल गर्नुहोस्!'
          : "You don't have any orders yet. Please visit our shop to start shopping!";
      }
      const latest = orders[0];
      const statusMap = {
        pending: language === 'ne' ? 'विचाराधीन' : 'Pending',
        confirmed: language === 'ne' ? 'पुष्टि भयो' : 'Confirmed',
        processing: language === 'ne' ? 'प्रशोधन' : 'Processing',
        packed: language === 'ne' ? 'प्याक गरियो' : 'Packed',
        shipped: language === 'ne' ? 'पठाइयो' : 'Shipped',
        delivered: language === 'ne' ? 'डेलिभर भयो' : 'Delivered',
        cancelled: language === 'ne' ? 'रद्द गरियो' : 'Cancelled',
      };
      if (language === 'ne') {
        return `तपाईंको पछिल्लो अर्डर ${latest.orderNumber} को स्थिति "${statusMap[latest.orderStatus]}" छ।`;
      }
      return `Your latest order ${latest.orderNumber} is currently "${statusMap[latest.orderStatus]}".`;
    }

    if (intent === 'product_recommendation') {
      const purchased = await getPurchaseHistory(userId);
      let products = await Product.find({ isActive: true })
        .sort({ rating: -1 })
        .limit(4)
        .select('name price images');
      if (purchased.length) {
        products = await Product.find({
          _id: { $nin: purchased },
          isActive: true,
        })
          .sort({ soldCount: -1 })
          .limit(4)
          .select('name price images');
      }
      if (!products.length) {
        return language === 'ne'
          ? 'हामीसँग हाल उपलब्ध उत्पादनहरू छैनन्।'
          : 'We currently have no products available.';
      }
      const names = products.map((p) => p.name).join(', ');
      return language === 'ne'
        ? `हामी यी उत्पादनहरू सिफारिस गर्छौं: ${names}`
        : `We recommend these products for you: ${names}`;
    }

    if (intent === 'loyalty') {
      const loyalty = await getLoyaltyContext(userId);
      if (!loyalty) {
        return language === 'ne'
          ? 'तपाईंसँग हाल कुनै लोयल्टी बिन्दुहरू छैनन्। किनमेल गरेर बिन्दु कमाउनुहोस्!'
          : 'You have no loyalty points yet. Shop to start earning points!';
      }
      return language === 'ne'
        ? `तपाईंसँग ${loyalty.points} अंक छन् र तपाईं ${loyalty.tier} सदस्य हुनुहुन्छ।`
        : `You have ${loyalty.points} points and are a ${loyalty.tier} member.`;
    }

    return null;
  } catch (error) {
    return null;
  }
};

// Main entry point: take a message + context, return a bot reply
exports.processMessage = async ({ userId, message, language }) => {
  const normalized = normalize(message);
  const detectedLang = language || detectLanguage(message);
  if (!normalized) {
    return {
      reply: detectedLang === 'ne' ? 'कसरी मद्दत गर्न सक्छु?' : 'How can I help you?',
      intent: 'fallback',
      language: detectedLang,
      escalateToHuman: false,
    };
  }

  const intents = await ChatbotIntent.find({ isActive: true }).sort({ priority: -1 });

  let bestIntent = null;
  let bestScore = 0;
  intents.forEach((intent) => {
    (intent.patterns || []).forEach((p) => {
      const langOk =
        p.language === 'both' || p.language === detectedLang;
      if (!langOk) return;
      const score = scorePattern(normalized, p.pattern);
      if (score > bestScore) {
        bestScore = score;
        bestIntent = intent;
      }
    });
  });

// Lower threshold makes the bot more forgiving so simple/common phrases
  // (e.g. "order", "return", "hello") are more likely to match one of the
  // seeded intents instead of falling back to the generic "I didn't understand".
  const threshold = 25;
  const matchedIntent = bestScore >= threshold ? bestIntent : null;

  if (!matchedIntent) {
    return {
      reply:
        detectedLang === 'ne'
          ? 'माफ गर्नुहोस्, म ठ्याक्कै बुझिन। के तपाईं आफ्नो अर्डरको स्थिति, उत्पादन सिफारिस वा फिर्ता नीतिको बारेमा सोध्न चाहनुहुन्छ? म तपाईंलाई मानव एजेन्टसँग जोड्न सक्छु।'
          : "Sorry, I didn't quite understand that. I can help you with your order status, product recommendations, returns, shipping, payments, and store hours. Try one of those, or tap below to talk to a human agent.",
      intent: 'fallback',
      language: detectedLang,
      escalateToHuman: false,
    };
  }

  // Try to build a dynamic, context-aware response
  const dynamic = await buildDynamicResponse({
    intent: matchedIntent.intent,
    userId,
    language: detectedLang,
  });
  if (dynamic) {
    return {
      reply: dynamic,
      intent: matchedIntent.intent,
      language: detectedLang,
      escalateToHuman: false,
      matchedIntentId: matchedIntent._id,
    };
  }

  // Static response from the intent config
  const responses = matchedIntent.responses[detectedLang] || matchedIntent.responses.en || [];
  const reply =
    responses[Math.floor(Math.random() * responses.length)] ||
    'Thank you for your message! A team member will assist you shortly.';

  return {
    reply,
    intent: matchedIntent.intent,
    language: detectedLang,
    escalateToHuman: matchedIntent.escalateToHuman,
    matchedIntentId: matchedIntent._id,
    followUp: matchedIntent.followUp,
  };
};
