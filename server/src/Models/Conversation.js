const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['support', 'order', 'group'],
      default: 'support',
    },
title: String, // for group chats
    customerName: String,
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    // For active customer <-> admin conversations
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    tags: [String],
    status: {
      type: String,
      enum: ['open', 'pending', 'resolved', 'closed'],
      default: 'open',
    },
    lastMessageAt: Date,
    lastMessagePreview: String,
    unreadCount: {
      type: Number,
      default: 0,
    },
    isPinned: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

conversationSchema.index({ participants: 1, lastMessageAt: -1 });
conversationSchema.index({ customer: 1, status: 1 });
conversationSchema.index({ order: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
