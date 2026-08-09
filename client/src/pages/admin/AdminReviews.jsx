import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../Services/api';
import { FaCheck, FaBan, FaStar, FaTrash } from 'react-icons/fa';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | approved | pending

  const loadReviews = async () => {
    try {
      const { data } = await api.get('/reviews');
      setReviews(data.reviews || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to load reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReviews(); }, []);

  const moderate = async (reviewId, isApproved) => {
    try {
      const { data } = await api.put(`/reviews/${reviewId}/moderate`, { isApproved });
      setReviews((prev) => prev.map((r) => (r._id === reviewId ? data.review : r)));
      toast.success(isApproved ? 'Review approved' : 'Review rejected');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update review');
    }
  };

  const remove = async (review) => {
    if (!window.confirm(`Delete review by ${review.user?.name || 'customer'}?`)) return;
    try {
      await api.delete(`/reviews/${review._id}`);
      setReviews((prev) => prev.filter((r) => r._id !== review._id));
      toast.success('Review deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to delete review');
    }
  };

  const filtered = reviews.filter((r) => {
    if (filter === 'approved') return r.isApproved;
    if (filter === 'pending') return !r.isApproved;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom px-4 lg:px-8">
        <section className="bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Review Moderation</h1>
              <p className="mt-1 text-sm text-gray-600">Approve, reject, or remove customer reviews.</p>
            </div>
            <div className="flex gap-2">
              {['all', 'approved', 'pending'].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${filter === f ? 'bg-pink-600 text-white' : 'border border-gray-300 bg-white text-gray-700'}`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {loading ? (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-10 text-center text-gray-500">Loading reviews...</div>
            ) : filtered.length ? (
              filtered.map((review) => (
                <div key={review._id} className={`rounded-2xl border p-5 ${review.isApproved ? 'border-gray-200 bg-gray-50' : 'border-amber-300 bg-amber-50'}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{review.user?.name || 'Customer'}</span>
                        {review.isVerifiedPurchase && (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">Verified purchase</span>
                        )}
                        {!review.isApproved && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Pending approval</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">on {review.product?.name || 'Product'} • {new Date(review.createdAt).toLocaleDateString()}</p>
                      <div className="mt-2 flex gap-1 text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <FaStar key={i} className={i < review.rating ? '' : 'text-gray-300'} />
                        ))}
                      </div>
                      {review.title && <p className="mt-2 font-semibold text-gray-900">{review.title}</p>}
                      <p className="mt-1 text-sm text-gray-700">{review.comment}</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {!review.isApproved && (
                        <button type="button" onClick={() => moderate(review._id, true)} className="flex items-center gap-1 rounded-full bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700">
                          <FaCheck /> Approve
                        </button>
                      )}
                      {review.isApproved && (
                        <button type="button" onClick={() => moderate(review._id, false)} className="flex items-center gap-1 rounded-full bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-700">
                          <FaBan /> Reject
                        </button>
                      )}
                      <button type="button" onClick={() => remove(review)} className="flex items-center gap-1 rounded-full bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700">
                        <FaTrash /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-10 text-center text-gray-500">No reviews found.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminReviews;
