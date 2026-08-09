const { processMessage } = require('../services/nlpService');
const ChatbotIntent = require('../Models/ChatbotIntent');
const Conversation = require('../Models/Conversation');
const Message = require('../Models/Message');
const loyaltyService = require('../services/loyaltyService');

// Send a chat message to the bot and get a reply
exports.sendMessage = async (req, res, next) => {
  try {
    const { message, language } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const result = await processMessage({ userId: req.user.id, message, language });

    // If escalation needed, create/resolve a support conversation
    if (result.escalateToHuman) {
      let conversation = await Conversation.findOne({
        customer: req.user.id,
        type: 'support',
        status: { $in: ['open', 'pending'] },
      });
      if (!conversation) {
        conversation = await Conversation.create({
          type: 'support',
          customer: req.user.id,
          participants: [req.user.id],
          title: 'Support',
          status: 'open',
          lastMessageAt: Date.now(),
        });
      }
      const userMessage = await Message.create({
        conversation: conversation._id,
        sender: req.user.id,
        senderName: req.user.name,
        message,
        messageType: 'text',
        status: 'new',
      });
      const systemMsg = await Message.create({
        conversation: conversation._id,
        sender: req.user.id,
        senderName: 'Sunita\u2019s Collection',
        message:
          result.language === 'ne'
            ? 'तपाईंलाई मानव एजेन्टसँग जोडिएको छ। कृपया फेरि सन्देश पठाउनुहोस्।'
            : 'You have been connected to a human agent. Please reply to continue.',
        messageType: 'system',
        isAutomated: true,
        status: 'new',
      });
      conversation.lastMessageAt = Date.now();
      conversation.lastMessagePreview = message;
      await conversation.save();

      res.status(200).json({
        success: true,
        reply: result.reply,
        intent: result.intent,
        language: result.language,
        escalated: true,
        conversationId: conversation._id,
        messages: [userMessage, systemMsg],
      });
      return;
    }

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// Create a support conversation for escalation to human agent
exports.escalate = async (req, res, next) => {
  try {
    const { message } = req.body;
    let conversation = await Conversation.findOne({
      customer: req.user.id,
      type: 'support',
      status: { $in: ['open', 'pending'] },
    });
    if (!conversation) {
      conversation = await Conversation.create({
        type: 'support',
        customer: req.user.id,
        participants: [req.user.id],
        title: 'Support',
        status: 'open',
        lastMessageAt: Date.now(),
      });
    }
    const escalationMessage = await Message.create({
      conversation: conversation._id,
      sender: req.user.id,
      senderName: req.user.name,
      message: message || 'Customer requested a human agent',
      messageType: 'text',
      status: 'new',
    });
    conversation.lastMessageAt = Date.now();
    conversation.lastMessagePreview = message || 'Customer requested a human agent';
    await conversation.save();

    const io = req.app.get('io');
    if (io) {
      io.to('admins').emit('conversation:new', conversation);
      io.to(`user_${req.user.id}`).emit('message:new', {
        conversationId: conversation._id,
        message: escalationMessage,
      });
    }

    res.status(200).json({
      success: true,
      conversationId: conversation._id,
      message: 'Escalated to a human agent',
    });
  } catch (error) {
    next(error);
  }
};

// Admin: list all chatbot intents
exports.getIntents = async (req, res, next) => {
  try {
    const intents = await ChatbotIntent.find().sort({ priority: -1 });
    res.status(200).json({ success: true, intents });
  } catch (error) {
    next(error);
  }
};

// Admin: create/update intent (FAQ management / training)
exports.saveIntent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;

    let intent;
    if (id) {
      intent = await ChatbotIntent.findById(id);
      if (!intent) {
        return res.status(404).json({ success: false, message: 'Intent not found' });
      }
      Object.assign(intent, data);
      await intent.save();
    } else {
      intent = await ChatbotIntent.create(data);
    }

    res.status(id ? 200 : 201).json({ success: true, intent });
  } catch (error) {
    next(error);
  }
};

// Admin: delete intent
exports.deleteIntent = async (req, res, next) => {
  try {
    const intent = await ChatbotIntent.findByIdAndDelete(req.params.id);
    if (!intent) {
      return res.status(404).json({ success: false, message: 'Intent not found' });
    }
    res.status(200).json({ success: true, message: 'Intent deleted' });
  } catch (error) {
    next(error);
  }
};

// Admin: conversation analytics & sentiment (simple keyword-based sentiment)
exports.getAnalytics = async (req, res, next) => {
  try {
    const [totalConversations, openConversations, totalMessages, intents] = await Promise.all([
      Conversation.countDocuments(),
      Conversation.countDocuments({ status: { $in: ['open', 'pending'] } }),
      Message.countDocuments({ messageType: { $ne: 'system' } }),
      ChatbotIntent.countDocuments({ isActive: true }),
    ]);

    // Simple sentiment analysis over recent messages
    const recentMessages = await Message.find({ messageType: 'text' })
      .sort({ createdAt: -1 })
      .limit(200)
      .select('message');

    const positiveWords = ['love', 'great', 'awesome', 'thank', 'happy', 'nice', 'best', 'perfect', 'good', 'i like'];
    const negativeWords = ['bad', 'worst', 'hate', 'poor', 'slow', 'broken', 'refund', 'complaint', 'worse', 'terrible'];

    let positive = 0;
    let negative = 0;
    let neutral = 0;
    recentMessages.forEach((m) => {
      const text = (m.message || '').toLowerCase();
      let pos = 0;
      let neg = 0;
      positiveWords.forEach((w) => {
        if (text.includes(w)) pos += 1;
      });
      negativeWords.forEach((w) => {
        if (text.includes(w)) neg += 1;
      });
      if (pos > neg) positive += 1;
      else if (neg > pos) negative += 1;
      else neutral += 1;
    });

    res.status(200).json({
      success: true,
      analytics: {
        totalConversations,
        openConversations,
        totalMessages,
        activeIntents: intents,
        sentiment: {
          positive,
          negative,
          neutral,
          total: recentMessages.length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
