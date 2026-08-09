const mongoose = require('mongoose');

const intentPatternSchema = new mongoose.Schema(
  {
    pattern: { type: String, required: true }, // regex or keyword
    language: { type: String, enum: ['en', 'ne', 'both'], default: 'both' },
  },
  { _id: false }
);

const chatbotIntentSchema = new mongoose.Schema(
  {
    intent: {
      type: String,
      required: true,
      unique: true,
    },
    category: {
      type: String,
      enum: [
        'order_status',
        'product_recommendation',
        'return_policy',
        'store_hours',
        'shipping',
        'payment',
        'contact',
        'help',
        'greeting',
        'farewell',
        'thanks',
        'loyalty',
        'escalation',
        'fallback',
      ],
      default: 'help',
    },
    description: String,
    patterns: {
      type: [intentPatternSchema],
      default: [],
    },
    responses: {
      en: [String],
      ne: [String],
    },
    followUp: String,
    escalateToHuman: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    priority: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ChatbotIntent', chatbotIntentSchema);
