const Post = require('../Models/Post');
const Follow = require('../Models/Follow');
const Challenge = require('../Models/Challenge');
const User = require('../Models/User');
const Product = require('../Models/Product');
const loyaltyService = require('../services/loyaltyService');

// Helper to normalize a post for API response (attach author info + liked state)
const serializePost = (post, currentUserId) => {
  const author = post.author || {};
  return {
    _id: post._id,
    caption: post.caption,
    images: post.images || [],
    hashtags: post.hashtags || [],
    tags: post.tags || [],
    likes: post.likes?.length || 0,
    likedByMe: (post.likes || []).some((l) => l.user && l.user.toString() === currentUserId),
    comments: post.comments || [],
    commentCount: post.comments?.length || 0,
    shares: post.shares || 0,
    isApproved: post.isApproved,
    isFlagged: post.isFlagged,
    isFeatured: post.isFeatured,
    challenge: post.challenge,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    author: author.name
      ? { _id: author._id, name: author.name, avatar: author.avatar }
      : null,
  };
};

// @desc    Get social feed (posts from users you follow + featured + recent)
// @route   GET /api/social/feed
// @access  Private
exports.getFeed = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Get users the current user follows
    const follows = await Follow.find({ follower: req.user.id }).select('following');
    const followingIds = follows.map((f) => f.following);

    const query = { isApproved: true };
    if (followingIds.length) {
      query.$or = [{ author: { $in: followingIds } }, { isFeatured: true }];
    } else {
      query.$or = [{ isFeatured: true }, { isApproved: true }];
    }

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name avatar');

    const total = await Post.countDocuments({ isApproved: true });

    res.status(200).json({
      success: true,
      posts: posts.map((p) => serializePost(p, req.user.id)),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a post
// @route   POST /api/social/posts
// @access  Private
exports.createPost = async (req, res, next) => {
  try {
    const { caption, images, hashtags, tags, challenge } = req.body;

    if (!images || !images.length) {
      return res.status(400).json({ success: false, message: 'At least one image is required' });
    }

    // Extract hashtags from caption if not provided
    let extractedHashtags = hashtags || [];
    if (caption) {
      const matches = caption.match(/#[a-zA-Z0-9_]+/g) || [];
      extractedHashtags = [...new Set([...extractedHashtags, ...matches.map((h) => h.slice(1))])];
    }

    // Resolve tagged products to snapshot name/price/image
    let resolvedTags = [];
    if (tags && tags.length) {
      const products = await Product.find({ _id: { $in: tags } }).select('name price images');
      resolvedTags = products.map((p) => ({
        product: p._id,
        name: p.name,
        price: p.price,
        image: p.images?.[0]?.url || '',
      }));
    }

    const post = await Post.create({
      author: req.user.id,
      caption: caption || '',
      images,
      hashtags: extractedHashtags,
      tags: resolvedTags,
      challenge: challenge || undefined,
    });

    // Award a small social badge
    try {
      await loyaltyService.awardBadge(req.user.id, 'social_star');
    } catch (e) { /* non-critical */ }

    // Notify followers via socket
    const app = require('../app');
    const io = app.get('io');
    if (io) {
      const follows = await Follow.find({ following: req.user.id }).select('follower');
      follows.forEach((f) => io.to(`user_${f.follower}`).emit('social:new', { postId: post._id }));
    }

    res.status(201).json({ success: true, post: serializePost(post, req.user.id) });
  } catch (error) {
    next(error);
  }
};

// @desc    Like/unlike a post
// @route   POST /api/social/posts/:id/like
// @access  Private
exports.toggleLike = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const index = post.likes.findIndex((l) => l.user.toString() === req.user.id);
    let liked = true;
    if (index !== -1) {
      post.likes.splice(index, 1);
      liked = false;
    } else {
      post.likes.push({ user: req.user.id });
    }
    await post.save();

    const app = require('../app');
    const io = app.get('io');
    if (io && liked && post.author.toString() !== req.user.id) {
      io.to(`user_${post.author}`).emit('social:like', { postId: post._id, userId: req.user.id });
    }

    res.status(200).json({ success: true, liked, likes: post.likes.length });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a comment to a post
// @route   POST /api/social/posts/:id/comments
// @access  Private
exports.addComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Comment text is required' });
    }
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    post.comments.push({ user: req.user.id, text: text.trim() });
    await post.save();

    const comment = post.comments[post.comments.length - 1];

    const app = require('../app');
    const io = app.get('io');
    if (io && post.author.toString() !== req.user.id) {
      io.to(`user_${post.author}`).emit('social:comment', { postId: post._id, comment });
    }

    res.status(201).json({ success: true, comment });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a post (author or admin)
// @route   DELETE /api/social/posts/:id
// @access  Private
exports.deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this post' });
    }
    await post.deleteOne();
    res.status(200).json({ success: true, message: 'Post deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Follow / unfollow a user
// @route   POST /api/social/follow/:userId
// @access  Private
exports.toggleFollow = async (req, res, next) => {
  try {
    const targetId = req.params.userId;
    if (targetId === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot follow yourself' });
    }
    const target = await User.findById(targetId);
    if (!target) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const existing = await Follow.findOne({ follower: req.user.id, following: targetId });
    let following = false;
    if (existing) {
      await existing.deleteOne();
    } else {
      await Follow.create({ follower: req.user.id, following: targetId });
      following = true;
    }

    const app = require('../app');
    const io = app.get('io');
    if (io && following) {
      io.to(`user_${targetId}`).emit('social:follow', { followerId: req.user.id });
    }

    res.status(200).json({ success: true, following });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a user's posts + profile
// @route   GET /api/social/users/:userId
// @access  Private
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId).select('name avatar');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const [posts, followerCount, followingCount, isFollowing] = await Promise.all([
      Post.find({ author: req.params.userId, isApproved: true }).sort({ createdAt: -1 }).limit(20),
      Follow.countDocuments({ following: req.params.userId }),
      Follow.countDocuments({ follower: req.params.userId }),
      Follow.findOne({ follower: req.user.id, following: req.params.userId }),
    ]);
    res.status(200).json({
      success: true,
      profile: {
        _id: user._id,
        name: user.name,
        avatar: user.avatar,
        followerCount,
        followingCount,
        isFollowing: !!isFollowing,
        posts: posts.map((p) => serializePost(p, req.user.id)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Trending hashtags
// @route   GET /api/social/hashtags/trending
// @access  Private
exports.getTrendingHashtags = async (req, res, next) => {
  try {
    const trending = await Post.aggregate([
      { $unwind: '$hashtags' },
      { $group: { _id: '$hashtags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ]);
    res.status(200).json({
      success: true,
      hashtags: trending.map((t) => ({ tag: t._id, count: t.count })),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get active challenges
// @route   GET /api/social/challenges
// @access  Private
exports.getChallenges = async (req, res, next) => {
  try {
    const now = new Date();
    const challenges = await Challenge.find({ isActive: true })
      .or([{ endsAt: { $exists: false } }, { endsAt: { $gt: now } }])
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, challenges });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: moderate posts (approve/flag/feature)
// @route   PUT /api/social/posts/:id/moderate
// @access  Private/Admin
exports.moderatePost = async (req, res, next) => {
  try {
    const { isApproved, isFeatured, isFlagged, flagReason } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    if (isApproved !== undefined) post.isApproved = isApproved;
    if (isFeatured !== undefined) post.isFeatured = isFeatured;
    if (isFlagged !== undefined) post.isFlagged = isFlagged;
    if (flagReason !== undefined) post.flagReason = flagReason;
    await post.save();
    res.status(200).json({ success: true, post: serializePost(post, req.user.id) });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: list all posts for moderation queue
// @route   GET /api/social/admin/posts
// @access  Private/Admin
exports.getModerationQueue = async (req, res, next) => {
  try {
    const posts = await Post.find({ isApproved: false })
      .or([{ isFlagged: true }, { isApproved: false }])
      .sort({ createdAt: -1 })
      .populate('author', 'name avatar');
    res.status(200).json({
      success: true,
      posts: posts.map((p) => serializePost(p, req.user.id)),
    });
  } catch (error) {
    next(error);
  }
};
