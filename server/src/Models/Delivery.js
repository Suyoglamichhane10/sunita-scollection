const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true,
    },
    deliveryPersonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled'],
      default: 'pending',
    },
    pickupLocation: {
      lat: { type: Number, default: 27.7172 },
      lng: { type: Number, default: 85.324 },
      address: { type: String, default: '' },
    },
    deliveryLocation: {
      lat: { type: Number, default: 27.7172 },
      lng: { type: Number, default: 85.324 },
      address: { type: String, default: '' },
    },
    currentLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      updatedAt: { type: Date, default: null },
    },
    estimatedDeliveryTime: { type: Date, default: null },
    actualDeliveryTime: { type: Date, default: null },
    distance: { type: Number, default: 0 },
    duration: { type: String, default: '' },
    route: [
      {
        lat: { type: Number },
        lng: { type: Number },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    deliveryPersonName: { type: String, default: '' },
    deliveryPersonPhone: { type: String, default: '' },
    deliveryPersonVehicle: { type: String, default: '' },
    deliveryPersonPhoto: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

deliverySchema.index({ deliveryPersonId: 1 });
deliverySchema.index({ status: 1 });

module.exports = mongoose.model('Delivery', deliverySchema);
