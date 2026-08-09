const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema(
  {
    name: String,
    url: String,
    publicId: String,
    mimeType: String,
    size: Number,
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    // Existing inquiry support (kept for backward compatibility with the
    // simple "contact us" form flow).
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    source: {
      type: String,
      enum: ['tiktok', 'whatsapp', 'facebook', 'website', 'chat'],
      default: 'chat',
    },
senderName: { type: String, trim: true },
    senderContact: { type: String, trim: true },
    // Platform sender id (Facebook PSID, WhatsApp phone, TikTok open id, etc.)
    platformSenderId: { type: String, index: true },
    message: {
      type: String,
      trim: true,
      maxlength: [5000, 'Message cannot be more than 5000 characters'],
    },
reply: { type: String, trim: true },
    status: { type: String, enum: ['new', 'replied', 'closed'], default: 'new' },
    repliedAt: Date,
    // Cross-platform reply routing metadata
    replyRoutedTo: { type: String },
    replyRoutedStatus: { type: String },

    // === Threaded real-time messaging fields ===
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'file', 'system'],
      default: 'text',
    },
    attachment: attachmentSchema,
    readBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        readAt: { type: Date, default: Date.now },
      },
    ],
    deliveredTo: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        deliveredAt: { type: Date, default: Date.now },
      },
    ],
    // For order-specific automated updates
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    isAutomated: { type: Boolean, default: false },
    isEdited: { type: Boolean, default: false },
    editedAt: Date,
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    reaction: String,
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ conversation: 1, createdAt: 1 });
messageSchema.index({ sender: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
