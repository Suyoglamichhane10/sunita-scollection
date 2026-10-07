const mongoose = require('mongoose');
const { phoneField, registerPhoneValidation } = require('../Utils/phoneValidator');

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      enum: ['customer', 'admin'],
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      min: 0,
    },
    type: {
      type: String,
      enum: ['reply', 'agree', 'disagree', 'counter', 'call', 'final', 'admin_update'],
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const enquirySchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    productName: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: phoneField({ required: true }),
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    messages: [messageSchema],
    status: {
      type: String,
      enum: ['pending', 'price_shared', 'negotiating', 'customer_agreed', 'deal_closed', 'rejected', 'converted'],
      default: 'pending',
    },
    quotedPrice: {
      type: Number,
      min: 0,
      default: null,
    },
    counterPrice: {
      type: Number,
      min: 0,
      default: null,
    },
    dealPrice: {
      type: Number,
      min: 0,
      default: null,
    },
    readByCustomer: {
      type: Boolean,
      default: true,
    },
    readByAdmin: {
      type: Boolean,
      default: false,
    },
    adminReply: {
      type: String,
      default: '',
    },
    repliedAt: {
      type: Date,
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    adminNote: {
      type: String,
      default: '',
    },
    agreeCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

registerPhoneValidation(enquirySchema, ['phone']);

enquirySchema.index({ productId: 1 });
enquirySchema.index({ userId: 1 });
enquirySchema.index({ status: 1 });
enquirySchema.index({ productId: 1, userId: 1 });
enquirySchema.index({ readByAdmin: 1 });
enquirySchema.index({ readByCustomer: 1 });

module.exports = mongoose.model('Enquiry', enquirySchema);
