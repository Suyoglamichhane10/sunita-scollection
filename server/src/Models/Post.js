const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'Comment cannot be more than 500 characters'],
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    caption: {
      type: String,
      trim: true,
      maxlength: [1000, 'Caption cannot be more than 1000 characters'],
    },
    images: [
      {
        url: { type: String, required: true },
        publicId: String,
      },
    ],
    hashtags: [String],
    // Products tagged in the post (for shoppable posts)
    tags: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
        },
        name: String,
        price: Number,
        image: String,
      },
    ],
    likes: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    comments: [commentSchema],
    shares: { type: Number, default: 0 },
    // For style challenges / contests
    challenge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Challenge',
    },
    // Moderation
    isApproved: { type: Boolean, default: true },
    isFlagged: { type: Boolean, default: false },
    flagReason: String,
    isFeatured: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);
