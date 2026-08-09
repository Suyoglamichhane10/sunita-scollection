const mongoose = require('mongoose');

const loyaltyTierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      enum: ['Bronze', 'Silver', 'Gold', 'Platinum'],
      require: true,
    },
    minPoints: { type: Number, default: 0 },
    discountPercent: { type: Number, default: 0 },
    benefits: [String],
  },
  { _id: false }
);

const badgeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true },
    name: { type: String, required: true },
    description: String,
    icon: String,
    earnedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const challengeProgressSchema = new mongoose.Schema(
  {
    code: { type: String, required: true },
    name: String,
    target: { type: Number, default: 1 },
    progress: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    rewardPoints: { type: Number, default: 0 },
    completedAt: Date,
  },
  { _id: false }
);

const rewardSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['discount', 'free_shipping', 'points_bonus', 'gift'],
      default: 'discount',
    },
    title: String,
    description: String,
    value: Number, // discount % or points
    code: String,
    expiresAt: Date,
    claimedAt: Date,
    isUsed: { type: Boolean, default: false },
  },
  { _id: false }
);

const gamificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    points: {
      type: Number,
      default: 0,
    },
    lifetimePoints: {
      type: Number,
      default: 0,
    },
    tier: {
      type: String,
      enum: ['Bronze', 'Silver', 'Gold', 'Platinum'],
      default: 'Bronze',
    },
    badges: {
      type: [badgeSchema],
      default: [],
    },
    challenges: {
      type: [challengeProgressSchema],
      default: [],
    },
    rewards: {
      type: [rewardSchema],
      default: [],
    },
    spinWheel: {
      lastSpinAt: Date,
      spinsToday: { type: Number, default: 0 },
      totalSpins: { type: Number, default: 0 },
    },
    referrals: [
      {
        email: String,
        earnedPoints: { type: Number, default: 0 },
        joined: { type: Boolean, default: false },
        joinedAt: Date,
      },
    ],
    birthdayReward: {
      year: Number,
      claimed: { type: Boolean, default: false },
      claimedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

gamificationSchema.index({ user: 1 });

module.exports = mongoose.model('Gamification', gamificationSchema);
