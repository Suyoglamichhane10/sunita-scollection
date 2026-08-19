const Message = require('../Models/Message');
const { sendWhatsAppReply } = require('../services/socialMediaService');

const formatPhoneForWhatsApp = (phone) => {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('977')) return digits;
  if (digits.length === 10 && digits.startsWith('97')) return '977' + digits;
  return digits;
};

exports.createMessage = async (req, res, next) => {
  try {
    const { source, senderName, senderContact, message } = req.body;

    if (!senderName || !message) {
      return res.status(400).json({ success: false, message: 'Name and message are required' });
    }

    const createdMessage = await Message.create({
      user: req.user.id,
      sender: req.user.id,
      source: source || 'website',
      senderName,
      senderContact,
      message,
      messageType: 'text',
      status: 'new',
    });

    const io = req.app.get('io');
    if (io) {
      io.to('admins').emit('message:created', createdMessage);
      io.to(`user_${req.user.id}`).emit('message:created', createdMessage);
    }

    res.status(201).json({ success: true, message: createdMessage });
  } catch (error) {
    next(error);
  }
};

exports.createPublicMessage = async (req, res, next) => {
  try {
    const { source, senderName, senderContact, message } = req.body;

    if (!senderName || !message) {
      return res.status(400).json({ success: false, message: 'Name and message are required' });
    }

    const createdMessage = await Message.create({
      source: source || 'website',
      senderName,
      senderContact,
      message,
      messageType: 'text',
      status: 'new',
    });

    const io = req.app.get('io');
    if (io) {
      io.to('admins').emit('message:created', createdMessage);
      io.to('admins').emit('notification:new', {
        message: `New message from ${senderName}: ${message.slice(0, 80)}`,
        type: 'message',
        createdAt: Date.now(),
      });
    }

    const whatsAppAdminNumber = process.env.WHATSAPP_ADMIN_NUMBER || '9768562128';
    const formattedAdminPhone = formatPhoneForWhatsApp(whatsAppAdminNumber);
    const formattedCustomerPhone = formatPhoneForWhatsApp(senderContact);

    const adminText = `📩 New Message from Sunita's Collection Website\n👤 Customer Name: ${senderName}\n📱 Phone: ${senderContact}\n📝 Message: ${message}\n\nPlease reply to this customer directly on WhatsApp.`;
    const customerText = `Thank you for reaching out to Sunita's Collection! We've received your message and will get back to you shortly. In the meantime, check out our latest collection on TikTok: https://www.tiktok.com/@sunitalamichhane27?_r=1&_t=ZS-98yy5adPc8O`;

    if (formattedAdminPhone) {
      sendWhatsAppReply(formattedAdminPhone, adminText).catch((err) => console.warn('[wa-admin-notify]', err.message));
    }
    if (formattedCustomerPhone) {
      sendWhatsAppReply(formattedCustomerPhone, customerText).catch((err) => console.warn('[wa-customer-reply]', err.message));
    }

    res.status(201).json({ success: true, message: createdMessage });
  } catch (error) {
    next(error);
  }
};

exports.createPublicTikTokMessage = async (req, res, next) => {
  try {
    const { senderName, senderContact, message } = req.body;

    if (!senderName || !message) {
      return res.status(400).json({ success: false, message: 'Name and message are required' });
    }

    const createdMessage = await Message.create({
      source: 'tiktok',
      senderName,
      senderContact,
      message,
      messageType: 'text',
      status: 'new',
    });

    const io = req.app.get('io');
    if (io) {
      io.to('admins').emit('message:created', createdMessage);
      io.to('admins').emit('notification:new', {
        message: `New TikTok message from ${senderName}: ${message.slice(0, 80)}`,
        type: 'message',
        createdAt: Date.now(),
      });
    }

    const whatsAppAdminNumber = process.env.WHATSAPP_ADMIN_NUMBER || '9768562128';
    const formattedAdminPhone = formatPhoneForWhatsApp(whatsAppAdminNumber);
    const adminText = `📩 New TikTok Message from Sunita's Collection Website\n👤 Customer Name: ${senderName}\n📱 Phone: ${senderContact}\n📝 Message: ${message}\n\nPlease reply to this customer directly on WhatsApp.`;

    if (formattedAdminPhone) {
      sendWhatsAppReply(formattedAdminPhone, adminText).catch((err) => console.warn('[wa-admin-notify-tiktok]', err.message));
    }

    res.status(201).json({ success: true, message: createdMessage });
  } catch (error) {
    next(error);
  }
};

exports.getMessages = async (req, res, next) => {
  try {
    const query = req.user.role === 'admin' ? {} : { user: req.user.id };
    const messages = await Message.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, messages });
  } catch (error) {
    next(error);
  }
};

exports.replyMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }
    if (message.user?.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { reply } = req.body;
    if (!reply) {
      return res.status(400).json({ success: false, message: 'Reply text is required' });
    }

message.reply = reply;
    message.status = 'replied';
    message.repliedAt = Date.now();
    // Record that this reply was routed back to an external platform
    message.replyRoutedTo = message.source && message.source !== 'website' && message.source !== 'chat'
      ? message.source
      : null;
    await message.save();

    // Cross-platform reply routing: if the original message came from a social
    // platform, send the admin's reply back to that platform so the customer
    // receives it on their original channel.
    if (message.replyRoutedTo && message.platformSenderId) {
      try {
        await sendPlatformReply(message.source, message.platformSenderId, reply);
      } catch (err) {
        // Platform credentials may not be configured in dev; log but don't fail.
        message.replyRoutedStatus = 'failed';
        await message.save();
        console.warn('[cross-platform reply]', err.message);
        return res.status(200).json({
          success: true,
          message,
          warning: 'Reply saved locally but platform delivery failed: ' + err.message,
        });
      }
    }

    const io = req.app.get('io');
    if (io) {
      if (message.user) io.to(`user_${message.user.toString()}`).emit('message:replied', message);
      io.to('admins').emit('message:replied', message);
    }

    res.status(200).json({ success: true, message });
  } catch (error) {
    next(error);
  }
};

exports.updateMessageStatus = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }
    if (message.user?.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { status } = req.body;
    if (status && ['new', 'replied', 'closed'].includes(status)) {
      message.status = status;
      await message.save();
    }

    res.status(200).json({ success: true, message });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a message (admin)
// @route   DELETE /api/messages/:id
// @access  Private/Admin
exports.deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // If the message belongs to a conversation, decrement the count reference
    if (message.conversation) {
      const Conversation = require('../Models/Conversation');
      const conversation = await Conversation.findById(message.conversation);
      if (conversation && conversation.lastMessagePreview === message.message) {
        const last = await Message.findOne({
          conversation: conversation._id,
          _id: { $ne: message._id },
        }).sort({ createdAt: -1 });
        conversation.lastMessagePreview = last ? last.message : '';
        await conversation.save();
      }
    }

    await message.deleteOne();

    const io = req.app.get('io');
    if (io) io.to('admins').emit('message:deleted', { messageId: message._id });

    res.status(200).json({ success: true, message: 'Message deleted' });
  } catch (error) {
    next(error);
  }
};
