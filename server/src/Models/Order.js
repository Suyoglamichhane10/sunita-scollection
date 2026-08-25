const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        name: String,
        price: Number,
        quantity: Number,
        image: String,
        total: Number,
        variantSku: String,
        variantTitle: String,
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: [0, 'Total amount cannot be negative'],
    },
    subtotal: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      default: 0,
    },
    shippingCost: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    couponCode: String,
    couponDiscount: Number,
    shippingAddress: {
      fullName: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      street: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: String,
      zipCode: String,
      country: {
        type: String,
        required: true,
        default: 'Nepal',
      },
      additionalInfo: String,
    },
    paymentMethod: {
      type: String,
      enum: ['cod', 'esewa', 'khalti', 'fonepay'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentDetails: {
      transactionId: String,
      paymentId: String,
      paymentDate: Date,
    },
    orderStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    statusHistory: [
      {
        status: String,
        note: String,
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    trackingNumber: String,
    deliveryDate: Date,
    notes: String,
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: Date,
    isDelivered: {
      type: Boolean,
      default: false,
    },
    deliveredAt: Date,
    delivery: {
      assigned: { type: Boolean, default: false },
      deliveryPersonId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      status: { type: String, default: 'pending' },
      trackingUrl: { type: String, default: '' },
      estimatedTime: { type: Date, default: null },
      actualTime: { type: Date, default: null },
      notes: { type: String, default: '' },
      pickupLocation: {
        lat: { type: Number, default: 27.7172 },
        lng: { type: Number, default: 85.324 },
        address: { type: String, default: '' },
      },
      deliveryLocation: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null },
        address: { type: String, default: '' },
      },
    },
  },
  {
    timestamps: true,
  }
);

// Generate the order number in a pre('validate') hook so that it is set
// BEFORE Mongoose runs validation. If this were in pre('save'), the required
// `orderNumber` field would still be undefined when validation runs, causing
// a "order number is required" error on new orders.
orderSchema.pre('validate', function (next) {
  if (this.isNew && !this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    this.orderNumber = `ORD-${year}${month}${day}-${random}`;
  }
  next();
});

orderSchema.index({ paymentStatus: 1, orderStatus: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
