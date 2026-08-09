const Message = require('../Models/Message');
const { sendPlatformReply } = require('../services/socialMediaService');

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
