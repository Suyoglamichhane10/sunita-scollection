import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../Services/api';
import { useCart } from '../../Context/CartContext';
import { useAuth } from '../../Context/Authcontext';
import toast from 'react-hot-toast';
import { FaStar, FaStarHalfAlt, FaRulerHorizontal } from 'react-icons/fa';
import RelatedProducts from '../../components/products/RelatedProducts';
import ImageGallery from '../../components/products/ImageGallery';
import Breadcrumb from '../../components/common/Breadcrumb';
import SocialShare from '../../components/products/SocialShare';
import SizeGuide from '../../components/products/SizeGuide';
import { getCloudinaryOptimizedUrl, getMainImage } from '../../utils/imageOptimizer';

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
            <FaStar className="text-yellow-400" />
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
  const [photo, setPhoto] = useState(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const fetchReviews = useCallback(async () => {
    try {
      const { data } = await api.get(`/reviews/product/${productId}`);
      setReviews(data.reviews);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    try {
      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPhoto(data.url || data.secure_url);
    } catch {
      toast.error('Failed to upload image');
    }
  };

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
      await api.post('/reviews', { product: productId, rating, title, comment, photo });
      toast.success('Review submitted successfully!');
      setRating(0);
      setTitle('');
      setComment('');
      setPhoto(null);
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
            <div>
              <label className="block text-sm font-medium text-gray-700">Add a photo (optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="mt-2 w-full rounded-3xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
              />
              {photo && (
                <div className="mt-2">
                  <img src={photo} alt="Preview" className="h-20 w-20 rounded-xl object-cover" />
                </div>
              )}
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
                  {review.photo && (
                    <img src={review.photo} alt="Review photo" className="mt-3 h-20 w-20 rounded-lg object-cover" />
                  )}
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

const getStockBadge = (stock, lowStockThreshold = 5) => {
  if (stock === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
        <span className="h-2 w-2 rounded-full bg-red-500" />
        Out of Stock
      </span>
    );
  }
  if (stock <= lowStockThreshold) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-700">
        <span className="h-2 w-2 rounded-full bg-yellow-500" />
        Low Stock ({stock} left)
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
      <span className="h-2 w-2 rounded-full bg-green-500" />
      In Stock
    </span>
  );
};

const getFirstAvailableVariant = (variants) => {
  if (!variants || !variants.length) return null;
  const purple = variants.find((v) => /purple/i.test(v.title || '') || /purple/i.test((v.attributes && (typeof v.attributes.get === 'function' ? v.attributes.get('color') : v.attributes?.color)) || ''));
  return purple || variants.find((v) => (v.stock || 0) > 0) || variants[0];
};

const extractSizes = (variants) => {
  if (!variants || !variants.length) return [];
  const map = new Map();
  variants.forEach((v) => {
    const attrs = v.attributes || new Map();
    const size = attrs.get?.('size') || attrs?.size;
    if (!size) return;
    const existing = map.get(size);
    if (existing) {
      existing.stock += v.stock || 0;
      existing.variants.push(v);
    } else {
      map.set(size, { label: size, stock: v.stock || 0, variants: [v] });
    }
  });
  return Array.from(map.values());
};

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [alsoBought, setAlsoBought] = useState([]);
  const [alsoBoughtLoading, setAlsoBoughtLoading] = useState(false);
  const [addToCartBounce, setAddToCartBounce] = useState(false);
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const isAuthenticatedRef = React.useRef(isAuthenticated);

  const sizes = useMemo(() => extractSizes(product?.variants), [product]);

  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  useEffect(() => {
    let active = true;
    const fetchProduct = async () => {
      try {
        const { data } = await api.get(`/products/${id}`);
        if (!active) return;
        const variants = data.product.variants || [];
        const firstAvailable = getFirstAvailableVariant(variants);
        setProduct(data.product);
        setSelectedVariant(firstAvailable);

        const sizeList = extractSizes(variants);
        if (sizeList.length > 0) {
          const firstAvailableSize = sizeList.find((s) => s.stock > 0) || sizeList[0];
          setSelectedSize(firstAvailableSize?.label || null);
          if (firstAvailableSize?.variants?.length) {
            setSelectedVariant(firstAvailableSize.variants[0]);
          }
        }

        if (isAuthenticatedRef.current) {
          try {
            await api.post('/recommendations/view', { productId: id });
          } catch {
            // View tracking is non-critical
          }
        }
      } catch (error) {
        if (active) console.error(error);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchProduct();
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    let active = true;
    const fetchRecentlyViewed = async () => {
      try {
        const { data } = await api.get('/recommendations/recently-viewed?limit=6');
        if (active) setRecentlyViewed(data.products || []);
      } catch {
        // Silently fail for recently viewed
      }
    };
    fetchRecentlyViewed();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const fetchAlsoBought = async () => {
      setAlsoBoughtLoading(true);
      try {
        const { data } = await api.get(`/products/related/${id}`);
        if (active) setAlsoBought(data.products || []);
      } catch {
        if (active) setAlsoBought([]);
      } finally {
        if (active) setAlsoBoughtLoading(false);
      }
    };
    if (id) fetchAlsoBought();
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (addToCartBounce) {
      const timer = setTimeout(() => setAddToCartBounce(false), 600);
      return () => clearTimeout(timer);
    }
  }, [addToCartBounce]);

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
  const lowStockThreshold = product.lowStockThreshold || 5;
  const hasDiscount = product.comparePrice && product.comparePrice > currentPrice;
  const discountPercent = hasDiscount ? Math.round(((product.comparePrice - currentPrice) / product.comparePrice) * 100) : 0;

  const breadcrumbItems = [
    { label: product.category?.name || 'Shop', href: `/shop?category=${product.category?._id || ''}` },
    { label: product.name },
  ];

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (stock < 1) return;
    const success = addToCart(product, quantity, selectedVariant);
    if (success) {
      setAddToCartBounce(true);
    }
  };

  const handleSizeSelect = (size) => {
    setSelectedSize(size);
    const sizeData = sizes.find((s) => s.label === size);
    if (sizeData?.variants?.length) {
      const preferred = sizeData.variants.find((v) => /purple/i.test(v.title || '') || /purple/i.test((v.attributes && (typeof v.attributes.get === 'function' ? v.attributes.get('color') : v.attributes?.color)) || ''));
      setSelectedVariant(preferred || sizeData.variants[0]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container-custom px-4 lg:px-8">
        <div className="mb-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="flex items-center justify-between gap-3 text-sm text-gray-500">
              <span>{product.category?.name || "Women's fashion"}</span>
              {getStockBadge(stock, lowStockThreshold)}
            </div>

            {product.brand && <p className="mt-3 text-sm font-semibold uppercase tracking-wide text-gray-500">{product.brand}</p>}
            <h1 className="mt-1 text-3xl font-bold text-gray-900">{product.name}</h1>

            <div className="mt-2 flex items-center gap-2">
              <StarRating value={product.rating?.average || 0} readOnly />
              <span className="text-sm text-gray-500">({product.rating?.count || 0} reviews)</span>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <p className="text-2xl font-bold text-pink-600">Rs. {currentPrice}</p>
              {hasDiscount && (
                <>
                  <p className="text-base text-gray-400 line-through">Rs. {product.comparePrice}</p>
                  <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-600">
                    {discountPercent}% OFF
                  </span>
                  {discountPercent >= 20 && (
                    <span className="animate-pulse rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-700">
                      Price Drop Alert!
                    </span>
                  )}
                </>
              )}
            </div>

            <p className="mt-4 leading-relaxed text-gray-600">{product.description}</p>

            <div className="mt-8 space-y-4">
              {sizes.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700">Size</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {sizes.map((sizeData) => {
                      const isOutOfStock = sizeData.stock <= 0;
                      const isActive = selectedSize === sizeData.label;
                      return (
                        <button
                          key={sizeData.label}
                          type="button"
                          disabled={isOutOfStock}
                          onClick={() => handleSizeSelect(sizeData.label)}
                          className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                            isActive
                              ? 'border-pink-600 bg-pink-600 text-white'
                              : isOutOfStock
                                ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 line-through'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          {sizeData.label}
                          {!isOutOfStock && (
                            <span className="ml-1 text-xs text-gray-500">({sizeData.stock})</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {product.variants && product.variants.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700">Variant</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {product.variants.map((v, idx) => {
                      const variantId = v.sku || v._id || idx;
                      const isActive = selectedVariant && (selectedVariant.sku || selectedVariant._id || idx) === variantId;
                      return (
                        <button
                          key={variantId}
                          type="button"
                          onClick={() => setSelectedVariant(v)}
                          className={`rounded-full border px-3 py-1 text-sm transition ${
                            isActive ? 'border-pink-600 bg-pink-600 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          {v.title || Array.from(v.attributes || new Map()).map(([_k, val]) => val).join(' / ')}
                        </button>
                      );
                    })}
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

              <div className={`flex gap-3 transition-transform duration-300 ${addToCartBounce ? 'scale-105' : 'scale-100'}`}>
                <button
                  disabled={stock < 1}
                  onClick={handleAddToCart}
                  className="flex-1 rounded-full bg-pink-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {stock < 1 ? 'Out of Stock' : 'Add to Cart'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSizeGuide(true)}
                  className="rounded-full border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-pink-300 hover:text-pink-600"
                  title="Size Guide"
                >
                  <FaRulerHorizontal className="inline mr-1" />
                  Size Guide
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <SocialShare productName={product.name} productUrl={`${window.location.origin}/product/${product._id}`} />
              </div>

              <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-700">Delivery</p>
                <p className="mt-1 text-sm text-gray-600">Free shipping over Rs. 1,000 • 3-5 business days nationwide.</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <ImageGallery
              images={product.images}
              fallbackImage="https://via.placeholder.com/800x800?text=Product"
              productName={product.name}
              selectedVariant={selectedVariant}
            />
          </div>
        </div>

        {recentlyViewed.length > 0 && (
          <div className="mt-12">
            <h2 className="font-serif text-2xl font-bold text-gray-900">Recently Viewed</h2>
            <p className="mt-1 text-sm text-gray-500">Products you have browsed recently</p>
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
              {recentlyViewed.map((p) => {
                const mainImage = getMainImage(p.images, p.name);
                return (
                  <Link key={p._id} to={`/product/${p._id}`} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
                    {mainImage?.url ? (
                      <img src={getCloudinaryOptimizedUrl(mainImage.url, 400)} alt={p.name} className="h-40 w-full object-cover" />
                    ) : (
                      <div className="flex h-40 w-full items-center justify-center bg-gray-100 text-3xl text-gray-300">👗</div>
                    )}
                    <div className="p-3">
                      <p className="line-clamp-1 text-sm font-semibold text-gray-900">{p.name}</p>
                      <p className="text-sm font-bold text-pink-600">Rs. {p.price}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {alsoBought.length > 0 && (
          <div className="mt-12">
            <h2 className="font-serif text-2xl font-bold text-gray-900">Customers Also Bought</h2>
            <p className="mt-1 text-sm text-gray-500">Frequently purchased together with this item</p>
            {alsoBoughtLoading ? (
              <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse rounded-3xl border border-gray-200 bg-gray-50 p-4">
                    <div className="h-40 w-full rounded-2xl bg-gray-200" />
                    <div className="mt-4 space-y-3">
                      <div className="h-4 w-3/4 rounded bg-gray-200" />
                      <div className="h-4 w-1/2 rounded bg-gray-200" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                {alsoBought.slice(0, 4).map((p) => {
                  const mainImage = getMainImage(p.images, p.name);
                  return (
                    <Link key={p._id} to={`/product/${p._id}`} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
                      {mainImage?.url ? (
                        <img src={getCloudinaryOptimizedUrl(mainImage.url, 400)} alt={p.name} className="h-40 w-full object-cover" />
                      ) : (
                        <div className="flex h-40 w-full items-center justify-center bg-gray-100 text-3xl text-gray-300">👗</div>
                      )}
                      <div className="p-3">
                        <p className="line-clamp-1 text-sm font-semibold text-gray-900">{p.name}</p>
                        <p className="text-sm font-bold text-pink-600">Rs. {p.price}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="mt-10">
          <ReviewsSection productId={product._id} productName={product.name} />
        </div>

        <RelatedProducts productId={product._id} />
      </div>

      <SizeGuide isOpen={showSizeGuide} onClose={() => setShowSizeGuide(false)} />
    </div>
  );
};

export default ProductDetail;
