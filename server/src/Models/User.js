const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
      maxlength: [50, 'Name cannot be more than 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['customer', 'admin', 'supplier'],
      default: 'customer',
    },
    phone: {
      type: String,
      trim: true,
    },
address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: {
        type: String,
        default: 'Nepal',
      },
    },
    addresses: [
      {
        fullName: String,
        phone: String,
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: {
          type: String,
          default: 'Nepal',
        },
        isDefault: {
          type: Boolean,
          default: false,
        },
      },
    ],
    avatar: {
      type: String,
      default: 'default-avatar.png',
    },
    avatarPublicId: {
      type: String,
      default: '',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    lastLogin: Date,
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    cart: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        quantity: {
          type: Number,
          default: 1,
          min: 1,
        },
        variantSku: {
          type: String,
          default: null,
        },
      },
    ],
orderHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
      },
    ],
    // === Personalized shopping profile ===
    styleProfile: {
      sizes: {
        top: String,
        bottom: String,
        footwear: String,
      },
      preferences: {
        colors: [String],
        styles: {
          type: [String],
          default: [],
        },
        occasions: {
          type: [String],
          default: [],
        },
        priceRange: {
          min: Number,
          max: Number,
        },
      },
      fitPreference: {
        type: String,
        enum: ['relaxed', 'regular', 'fitted'],
        default: 'regular',
      },
      language: {
        type: String,
        enum: ['en', 'ne'],
        default: 'en',
      },
    },
    recentlyViewed: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
        },
        viewedAt: { type: Date, default: Date.now },
      },
    ],
    savedLooks: [
      {
        name: String,
        items: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
          },
        ],
        image: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    loyalty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gamification',
    },
    referralCode: String,
    notifications: [
      {
        message: String,
        type: {
          type: String,
          enum: ['order', 'promotion', 'system'],
        },
        read: {
          type: Boolean,
          default: false,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isDeliveryPerson: { type: Boolean, default: false },
    vehicle: {
      type: String,
      enum: ['bike', 'car', 'van', 'truck', 'foot'],
      default: null,
    },
    vehicleNumber: { type: String, default: '' },
    currentLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      updatedAt: { type: Date, default: null },
    },
    isAvailable: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

// Encrypt password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT
userSchema.methods.getSignedJwtToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE,
    }
  );
};

module.exports = mongoose.model('User', userSchema);
