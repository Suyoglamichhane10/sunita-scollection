const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../Middleware/auth');
const {
  getFeed,
  createPost,
  toggleLike,
  addComment,
  deletePost,
  toggleFollow,
  getUserProfile,
  getTrendingHashtags,
  getChallenges,
  moderatePost,
  getModerationQueue,
} = require('../controllers/socialController');

// Public-ish (protected) routes
router.get('/feed', protect, getFeed);
router.get('/hashtags/trending', protect, getTrendingHashtags);
router.get('/challenges', protect, getChallenges);
router.get('/users/:userId', protect, getUserProfile);

// Posts
router.post('/posts', protect, createPost);
router.post('/posts/:id/like', protect, toggleLike);
router.post('/posts/:id/comments', protect, addComment);
router.delete('/posts/:id', protect, deletePost);

// Follows
router.post('/follow/:userId', protect, toggleFollow);

// Admin moderation
router.get('/admin/posts', protect, authorize('admin'), getModerationQueue);
router.put('/posts/:id/moderate', protect, authorize('admin'), moderatePost);

module.exports = router;
