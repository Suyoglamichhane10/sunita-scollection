import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../Services/api';
import { useCart } from '../../Context/CartContext';
import { useAuth } from '../../Context/Authcontext';
import toast from 'react-hot-toast';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';

const StarRating = ({ value, onChange, readOnly }) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange && onChange(star)}
          className={readOnly ? '' : 'cursor-pointer'}
        >
          {star <= value ? (
            <FaStar className={readOnly ? 'text-yellow-400' : 'text-yellow-400'} />
          ) : star - 0.5 <= value ? (
            <FaStarHalfAlt className="text-yellow-400" />
          ) : (
            <FaStar className="text-gray-300" />
          )}
        </button>
      ))}
    </div>
  );
};

const ReviewsSection = ({ productId, productName }) => {
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const fetchReviews = async () => {
    try {
      const { data } = await api.get(`/reviews/product/${productId}`);
      setReviews(data.reviews);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!rating) {
      toast.error('Please select a rating');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/reviews', { product: productId, rating, title, comment });
      toast.success('Review submitted successfully!');
      setRating(0);
      setTitle('');
      setComment('');
      fetchReviews();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
      <p className="mt-2 text-gray-600">See what others think about {productName}.</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Write a Review</h3>
          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Your rating</label>
              <div className="mt-2">
                <StarRating value={rating} onChange={setRating} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-2 w-full rounded-3xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                placeholder="Great quality!"
                maxLength={100}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Comment</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
                className="mt-2 h-28 w-full rounded-3xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                placeholder="Share your experience..."
                maxLength={1000}
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-pink-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-gray-900">All Reviews ({reviews.length})</h3>
          <div className="mt-5 space-y-4">
            {loading ? (
              <div className="rounded-3xl border border-gray-200 bg-gray-50 p-6 text-center text-gray-600">Loading reviews...</div>
            ) : reviews.length ? (
              reviews.map((review) => (
                <div key={review._id} className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{review.user?.name || 'Customer'}</p>
                      {review.isVerifiedPurchase && (
                        <span className="mt-1 inline-block rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">Verified Purchase</span>
                      )}
                    </div>
                    <StarRating value={review.rating} readOnly />
                  </div>
                  {review.title && <p className="mt-3 font-medium text-gray-900">{review.title}</p>}
                  <p className="mt-1 text-sm text-gray-600">{review.comment}</p>
                  <p className="mt-3 text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</p>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-gray-200 bg-gray-50 p-6 text-center text-gray-600">No reviews yet. Be the first to review!</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await api.get(`/products/${id}`);
        setProduct(data.product);
setSelectedVariant(data.product.variants?.[0] || null);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-20">
        <div className="container-custom px-4 lg:px-8">
          <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">Loading product...</div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 py-20">
        <div className="container-custom px-4 lg:px-8">
          <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">Product not found.</div>
        </div>
      </div>
    );
  }

  const stock = selectedVariant?.stock ?? product.stock;
  const currentPrice = selectedVariant?.price ?? product.price;

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container-custom px-4 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
            <img
              src={selectedVariant?.images?.[0]?.url || product.images?.[0]?.url || 'https://via.placeholder.com/800x800?text=Product'}
              alt={product.name}
              className="h-[420px] w-full rounded-3xl object-cover"
            />
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {product.images?.slice(1, 5).map((img, index) => (
                <img
                  key={index}
                  src={img.url}
                  alt={`${product.name}-${index}`}
                  className="h-40 w-full rounded-3xl object-cover"
                />
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="flex items-center justify-between gap-3 text-sm text-gray-500">
              <span>{product.category?.name || "Women's fashion"}</span>
              <span className={stock > 0 ? 'font-semibold text-green-600' : 'font-semibold text-red-600'}>
                {stock > 0 ? `In stock (${stock} pieces available)` : 'Out of stock'}
              </span>
            </div>
{product.brand && <p className="mt-3 text-sm font-semibold uppercase tracking-wide text-gray-500">{product.brand}</p>}
            <h1 className="mt-1 text-3xl font-bold text-gray-900">{product.name}</h1>
            <div className="mt-2 flex items-center gap-2">
              <StarRating value={product.rating?.average || 0} readOnly />
              <span className="text-sm text-gray-500">({product.rating?.count || 0} reviews)</span>
            </div>
            <p className="mt-4 text-lg font-semibold text-pink-600">Rs. {currentPrice}</p>
            {product.comparePrice && product.comparePrice > currentPrice && (
              <p className="mt-1 text-sm text-gray-400 line-through">Rs. {product.comparePrice}</p>
            )}
            <p className="mt-4 leading-relaxed text-gray-600">{product.description}</p>

            <div className="mt-8 space-y-4">
              {product.variants && product.variants.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700">Variant</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {product.variants.map((v, idx) => (
                      <button
                        key={v.sku || idx}
                        type="button"
                        onClick={() => setSelectedVariant(v)}
                        className={`rounded-full border px-3 py-1 text-sm ${selectedVariant === v ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                      >
                        {v.title || Array.from(v.attributes || new Map()).map(([k, val]) => val).join(' / ')}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700">Quantity</label>
                <input
                  type="number"
                  min="1"
                  max={stock || 1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  className="mt-2 w-24 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                />
              </div>

<button
                  disabled={stock < 1}
                  onClick={() => {
                    if (!isAuthenticated) {
                      navigate('/login');
                      return;
                    }
                    addToCart(product, quantity, selectedVariant);
                  }}
                  className="w-full rounded-full bg-pink-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  Add to Cart
                </button>

              <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-700">Delivery</p>
                <p className="mt-1 text-sm text-gray-600">Free shipping over Rs. 1,000 • 3-5 business days nationwide.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <ReviewsSection productId={product._id} productName={product.name} />
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
