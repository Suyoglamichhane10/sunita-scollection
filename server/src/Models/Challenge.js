const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    coverImage: String,
    hashtag: { type: String, required: true, unique: true },
    startsAt: Date,
    endsAt: Date,
    isActive: { type: Boolean, default: true },
    rewardPoints: { type: Number, default: 0 },
    // Optional featured product(s) associated with the challenge
    featuredProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Challenge', challengeSchema);
