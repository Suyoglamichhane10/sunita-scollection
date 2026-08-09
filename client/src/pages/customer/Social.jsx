import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaHeart, FaComment, FaShare, FaUserPlus, FaCamera, FaFire, FaTrophy,
} from 'react-icons/fa';
import api from '../../Services/api';
import { useAuth } from '../../Context/Authcontext';
import { useCart } from '../../Context/CartContext';
import toast from 'react-hot-toast';

const Social = () => {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [hashtags, setHashtags] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const [caption, setCaption] = useState('');
  const [imageUrls, setImageUrls] = useState('');
  const [hashtagFilter, setHashtagFilter] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchFeed();
    fetchSidebar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, navigate]);

  const fetchFeed = async (tag) => {
    try {
      const { data } = await api.get('/social/feed', {
        params: tag ? { tag } : {},
      });
      setPosts(data.posts);
      setHashtagFilter(tag || '');
    } catch (error) {
      toast.error('Unable to load feed');
    } finally {
      setLoading(false);
    }
  };

  const fetchSidebar = async () => {
    try {
      const [h, c] = await Promise.all([
        api.get('/social/hashtags/trending'),
        api.get('/social/challenges'),
      ]);
      setHashtags(h.data.hashtags || []);
      setChallenges(c.data.challenges || []);
    } catch (error) {
      /* non-critical */
    }
  };

  const createPost = async () => {
    const urls = imageUrls.split(',').map((u) => u.trim()).filter(Boolean);
    if (!urls.length) {
      toast.error('Add at least one image URL');
      return;
    }
    try {
      await api.post('/social/posts', {
        caption,
        images: urls.map((url) => ({ url })),
      });
      toast.success('Post published!');
      setCaption('');
      setImageUrls('');
      setShowComposer(false);
      fetchFeed();
      fetchSidebar();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to create post');
    }
  };

  const toggleLike = async (postId) => {
    try {
      const { data } = await api.post(`/social/posts/${postId}/like`);
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? { ...p, likedByMe: data.liked, likes: data.likes }
            : p
        )
      );
    } catch (error) {
      toast.error('Unable to like post');
    }
  };

  const addComment = async (postId, text) => {
    if (!text.trim()) return;
    try {
      const { data } = await api.post(`/social/posts/${postId}/comments`, { text });
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? { ...p, comments: [...(p.comments || []), data.comment], commentCount: (p.commentCount || 0) + 1 }
            : p
        )
      );
    } catch (error) {
      toast.error('Unable to comment');
    }
  };

  const sharePost = async (post) => {
    const url = `${window.location.origin}/product/${post.tags?.[0]?.product || ''}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: post.caption || 'Check this out!', url });
      } catch (e) { /* cancelled */ }
    } else {
      navigator.clipboard?.writeText(url || window.location.href);
      toast.success('Link copied!');
    }
  };

  const isMine = (post) => post.author?._id === user?._id;

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container-custom px-4 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Style Community</h1>
            <p className="mt-1 text-gray-600">Share looks, get inspired, and shop what you see.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowComposer((v) => !v)}
            className="flex items-center gap-2 rounded-full bg-pink-600 px-6 py-3 text-sm font-semibold text-white hover:bg-pink-700"
          >
            <FaCamera /> {showComposer ? 'Close' : 'Create Post'}
          </button>
        </div>

        {/* Composer */}
        {showComposer && (
          <div className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <label className="block text-sm font-semibold text-gray-700">Caption</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
              placeholder="Share your style... use #hashtags"
              className="mt-2 w-full rounded-2xl border border-gray-300 p-4 text-sm outline-none focus:border-pink-500"
            />
            <label className="mt-4 block text-sm font-semibold text-gray-700">
              Image URLs (comma-separated)
            </label>
            <input
              value={imageUrls}
              onChange={(e) => setImageUrls(e.target.value)}
              placeholder="https://...jpg, https://...png"
              className="mt-2 w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-pink-500"
            />
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={createPost}
                className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Publish
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          {/* Feed */}
          <div className="space-y-6">
            {loading ? (
              <div className="rounded-3xl border border-gray-200 bg-white p-16 text-center shadow-sm">Loading community...</div>
            ) : posts.length ? (
              posts.map((post) => (
                <article key={post._id} className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
                  {/* Header */}
                  <div className="flex items-center gap-3 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100 text-pink-600">
                      {post.author?.name?.[0] || 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900">{post.author?.name || 'User'}</p>
                      <p className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</p>
                    </div>
                    {post.isFeatured && <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">Featured</span>}
                  </div>

                  {/* Images */}
                  {post.images?.map((img) => (
                    <img key={img._id || img.url} src={img.url} alt={post.caption} className="w-full object-cover" />
                  ))}

                  {/* Caption + hashtags */}
                  <div className="p-4">
                    <p className="text-sm text-gray-800">{post.caption}</p>
                    {post.hashtags?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {post.hashtags.map((h) => (
                          <button
                            key={h}
                            type="button"
                            onClick={() => fetchFeed(h)}
                            className="text-xs font-semibold text-pink-600 hover:text-pink-800"
                          >
                            #{h}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Tagged products */}
                    {post.tags?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {post.tags.map((t) => (
                          <div key={t.product} className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5">
                            <img src={t.image} alt={t.name} className="h-6 w-6 rounded-full object-cover" />
                            <span className="text-xs font-semibold text-gray-700">{t.name}</span>
                            <button
                              type="button"
                              onClick={() => addToCart({ _id: t.product, name: t.name, price: t.price, images: [{ url: t.image }], stock: 10 }, 1, null)}
                              className="text-xs font-bold text-pink-600 hover:text-pink-800"
                            >
                              Add
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-4 flex items-center gap-4 border-t border-gray-100 pt-3">
                      <button
                        type="button"
                        onClick={() => toggleLike(post._id)}
                        className={`flex items-center gap-1.5 text-sm font-semibold ${post.likedByMe ? 'text-pink-600' : 'text-gray-500 hover:text-pink-600'}`}
                      >
                        <FaHeart className={post.likedByMe ? 'text-pink-600' : ''} /> {post.likes}
                      </button>
                      <button type="button" onClick={() => addComment(post._id, prompt('Write a comment:'))} className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-pink-600">
                        <FaComment /> {post.commentCount || 0}
                      </button>
                      <button type="button" onClick={() => sharePost(post)} className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-pink-600">
                        <FaShare /> {post.shares}
                      </button>
                      {isMine(post) && (
                        <button
                          type="button"
                          onClick={async () => {
                            if (window.confirm('Delete this post?')) {
                              try {
                                await api.delete(`/social/posts/${post._id}`);
                                setPosts((prev) => prev.filter((p) => p._id !== post._id));
                                toast.success('Post deleted');
                              } catch (e) {
                                toast.error('Unable to delete post');
                              }
                            }
                          }}
                          className="ml-auto text-sm text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                      )}
                    </div>

                    {/* Comments */}
                    {post.comments?.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {post.comments.slice(-3).map((c) => (
                          <div key={c._id} className="rounded-2xl bg-gray-50 p-2 text-sm">
                            <span className="font-semibold text-gray-800">{c.user?.name || 'User'}: </span>
                            <span className="text-gray-600">{c.text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-3xl border border-gray-200 bg-white p-16 text-center shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900">No posts yet</h2>
                <p className="mt-3 text-gray-600">Be the first to share a look with the community!</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trending hashtags */}
            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <FaFire className="text-orange-500" />
                <h2 className="font-bold text-gray-900">Trending Hashtags</h2>
              </div>
              {hashtags.length ? (
                <div className="flex flex-wrap gap-2">
                  {hashtags.map((h) => (
                    <button
                      key={h.tag}
                      type="button"
                      onClick={() => fetchFeed(h.tag)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${hashtagFilter === h.tag ? 'bg-pink-600 text-white' : 'bg-pink-50 text-pink-700 hover:bg-pink-100'}`}
                    >
                      #{h.tag} <span className="opacity-70">({h.count})</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No hashtags yet.</p>
              )}
            </section>

            {/* Challenges */}
            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <FaTrophy className="text-yellow-500" />
                <h2 className="font-bold text-gray-900">Style Challenges</h2>
              </div>
              {challenges.length ? (
                <div className="space-y-3">
                  {challenges.map((c) => (
                    <div key={c._id} className="rounded-2xl bg-gray-50 p-3">
                      <p className="font-semibold text-gray-900">{c.title}</p>
                      <p className="text-xs text-gray-500">#{c.hashtag}</p>
                      {c.rewardPoints > 0 && (
                        <p className="mt-1 text-xs font-semibold text-pink-600">+{c.rewardPoints} pts</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No active challenges.</p>
              )}
            </section>

            {/* Your profile */}
            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  {user?.name?.[0] || 'U'}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">Share your style</p>
                </div>
              </div>
              <Link to="/profile" className="mt-4 block w-full rounded-full bg-blue-600 py-2 text-center text-sm font-semibold text-white hover:bg-blue-700">
                Edit Style Profile
              </Link>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Social;
