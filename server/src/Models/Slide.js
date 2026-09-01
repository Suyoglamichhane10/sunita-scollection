const mongoose = require('mongoose');

const slideSchema = new mongoose.Schema(
  {
    imageUrl: { type: String, required: [true, 'Image URL is required'] },
    imagePublicId: { type: String, default: null },
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: [200, 'Title cannot exceed 200 characters'] },
    subtitle: { type: String, trim: true, maxlength: [500, 'Subtitle cannot exceed 500 characters'], default: '' },
    buttonText: { type: String, trim: true, maxlength: [100, 'Button text cannot exceed 100 characters'], default: 'Shop Now' },
    buttonLink: { type: String, trim: true, default: '/shop' },
    order: { type: Number, required: [true, 'Display order is required'], min: [1, 'Order must be at least 1'], default: 1 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

slideSchema.index({ order: 1, isActive: 1 });

module.exports = mongoose.model('Slide', slideSchema);
