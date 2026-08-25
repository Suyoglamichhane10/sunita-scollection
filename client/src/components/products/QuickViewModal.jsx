import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaStar, FaStarHalfAlt, FaHeart, FaShoppingBag, FaTimes } from 'react-icons/fa';
import { useCart } from '../../Context/CartContext';
import { useAuth } from '../../Context/Authcontext';
import toast from 'react-hot-toast';
import wishlistApi from '../../Services/wishlistApi';
import { getMainImage, getCloudinaryOptimizedUrl } from '../../utils/imageOptimizer';

const getAttr = (variant, key) => {
  if (!variant || !variant.attributes) return undefined;
  if (typeof variant.attributes.get === 'function') return variant.attributes.get(key);
  return variant.attributes[key];
};

const StarRating = ({ value, _readOnly }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <span key={star}>
        {star <= value ? (
          <FaStar className="text-yellow-400" />
        ) : star - 0.5 <= value ? (
          <FaStarHalfAlt className="text-yellow-400" />
        ) : (
          <FaStar className="text-gray-300" />
        )}
      </span>
    ))}
  </div>
);

const QuickViewModal = ({ product, isOpen, onClose }) => {
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [inWishlist, setInWishlist] = useState(false);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  const variants = product?.variants || [];

  // Derive color + size option sets from variant attributes
  const colorOptions = [...new Set(variants.map((v) => getAttr(v, 'color')).filter(Boolean))];
  const sizeOptions = [...new Set(variants.map((v) => getAttr(v, 'size')).filter(Boolean))];

  useEffect(() => {
    if (isOpen && product) {
      const initialVariant = variants[0] || null;
      setSelectedVariant(initialVariant);
      setSelectedColor(getAttr(initialVariant, 'color') || '');
      setSelectedSize(getAttr(initialVariant, 'size') || '');
      setQuantity(1);
      const imgs = [];
      if (initialVariant?.images?.length) imgs.push(...initialVariant.images);
      if (product.images?.length) {
        product.images.forEach((img) => {
          if (!imgs.find((i) => i.url === img.url)) imgs.push(img);
        });
      }
      setMainImage(getMainImage(imgs, product.name));

      // Load related products + reviews
      setRelatedLoading(true);
      Promise.all([
        fetch(`/api/products/related/${product._id}`).then((r) => r.json()).catch(() => ({ products: [] })),
        fetch(`/api/reviews/product/${product._id}`).then((r) => r.json()).catch(() => ({ reviews: [] })),
      ]).then(([rel, rev]) => {
        setRelated(rel.products || []);
        setReviews(rev.reviews || []);
        setRelatedLoading(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, product]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const stock = selectedVariant?.stock ?? product.stock;
  const currentPrice = selectedVariant?.price ?? product.price;
  const displayImages = [];
  if (selectedVariant?.images?.length) displayImages.push(...selectedVariant.images);
  if (product.images?.length) {
    product.images.forEach((img) => {
      if (!displayImages.find((i) => i.url === img.url)) displayImages.push(img);
    });
  }

  const handleMouseMove = (e) => {
    if (!isZoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePosition({ x, y });
  };

  const handleColorSelect = (color) => {
    setSelectedColor(color);
    const match = variants.find((v) => getAttr(v, 'color') === color && (!selectedSize || getAttr(v, 'size') === selectedSize));
    if (match) {
      setSelectedVariant(match);
    } else {
      const fallback = variants.find((v) => getAttr(v, 'color') === color);
      if (fallback) setSelectedVariant(fallback);
    }
  };

  const handleSizeSelect = (size) => {
    setSelectedSize(size);
    const match = variants.find((v) => getAttr(v, 'size') === size && (!selectedColor || getAttr(v, 'color') === selectedColor));
    if (match) {
      setSelectedVariant(match);
    } else {
      const fallback = variants.find((v) => getAttr(v, 'size') === size);
      if (fallback) setSelectedVariant(fallback);
    }
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      onClose();
      return;
    }
    addToCart(product, quantity, selectedVariant);
    onClose();
  };

  const toggleWishlist = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist');
      return;
    }
    try {
      await wishlistApi.addToWishlist(product._id, selectedVariant?.sku);
      setInWishlist(true);
      toast.success('Added to wishlist!');
    } catch {
      toast.error('Failed to add to wishlist');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="relative max-h-[92vh] max-w-4xl w-full overflow-y-auto rounded-3xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-white/90 p-2 shadow-lg backdrop-blur-sm transition hover:bg-gray-100"
        >
          <FaTimes className="h-5 w-5 text-gray-600" />
        </button>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="p-6">
            <div
              className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-50"
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
              onMouseMove={handleMouseMove}
            >
              <div className="relative aspect-square w-full">
                <img
                  src={getCloudinaryOptimizedUrl(mainImage?.url, 1200)}
                  alt={product.name}
                  loading="lazy"
                  className={`h-full w-full object-contain transition-transform duration-300 ${
                    isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
                  }`}
                  style={
                    isZoomed
                      ? { transformOrigin: `${mousePosition.x}% ${mousePosition.y}%` }
                      : undefined
                  }
                />
              </div>
            </div>
            {displayImages.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {displayImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setMainImage(img)}
                    className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border-2 transition ${
                      mainImage?.url === img.url ? 'border-pink-600 ring-2 ring-pink-200' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={getCloudinaryOptimizedUrl(img.url, 200)}
                      alt={`${product.name} thumbnail ${idx + 1}`}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-6 md:pl-0">
            <p className="text-sm font-semibold text-gray-500">{product.category?.name || "Women's fashion"}</p>
            <h2 className="mt-1 text-2xl font-bold text-gray-900">{product.name}</h2>
            <div className="mt-2 flex items-center gap-2">
              <StarRating value={product.rating?.average || 0} readOnly />
              <span className="text-sm text-gray-500">({product.rating?.count || 0} reviews)</span>
            </div>

            {product.views !== undefined && (
              <p className="mt-1 text-xs text-gray-400">{product.views} views</p>
            )}

            <p className="mt-4 text-2xl font-bold text-pink-600">Rs. {currentPrice}</p>
            {product.comparePrice && product.comparePrice > currentPrice && (
              <p className="mt-1 text-sm text-gray-400 line-through">Rs. {product.comparePrice}</p>
            )}

            {/* Stock status */}
            <div className="mt-3">
              {stock === 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                  Out of Stock
                </span>
              ) : stock <= (product.lowStockThreshold || 5) ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-700">
                  Only {stock} left
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                  In Stock ({stock})
                </span>
              )}
            </div>

            {/* Color selector */}
            {colorOptions.length > 0 && (
              <div className="mt-6">
                <label className="block text-sm font-semibold text-gray-700">
                  Color: <span className="font-normal text-gray-500">{selectedColor || 'Select'}</span>
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => handleColorSelect(color)}
                      className={`rounded-full border px-3 py-1 text-sm transition ${
                        selectedColor === color ? 'border-pink-600 bg-pink-600 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size selector */}
            {sizeOptions.length > 0 && (
              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-700">
                  Size: <span className="font-normal text-gray-500">{selectedSize || 'Select'}</span>
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {sizeOptions.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => handleSizeSelect(size)}
                      className={`min-w-[2.5rem] rounded-lg border px-3 py-1.5 text-sm transition ${
                        selectedSize === size ? 'border-pink-600 bg-pink-600 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Variant fallback (no color/size attributes) */}
            {variants.length > 0 && colorOptions.length === 0 && sizeOptions.length === 0 && (
              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-700">Variant</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {variants.map((v, idx) => {
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

            <div className="mt-6">
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

            <div className="mt-6 flex gap-3">
              <button
                disabled={stock < 1}
                onClick={handleAddToCart}
                className="flex-1 rounded-full bg-pink-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                <FaShoppingBag className="mr-2 inline" />
                {stock < 1 ? 'Out of Stock' : 'Add to Cart'}
              </button>
              <button
                type="button"
                onClick={toggleWishlist}
                className={`rounded-full px-4 py-3 transition ${inWishlist ? 'bg-red-500 text-white' : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                <FaHeart />
              </button>
            </div>

            <Link to={`/product/${product._id}`} onClick={onClose} className="mt-3 block text-center text-sm font-semibold text-pink-600 hover:text-pink-700">
              View full details
            </Link>

            {/* Customer reviews preview */}
            {reviews.length > 0 && (
              <div className="mt-6 border-t border-gray-100 pt-4">
                <h3 className="text-sm font-semibold text-gray-800">Customer Reviews</h3>
                <div className="mt-3 space-y-3">
                  {reviews.slice(0, 3).map((review) => (
                    <div key={review._id} className="rounded-xl bg-gray-50 p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-800">{review.user?.name || 'Anonymous'}</p>
                        <StarRating value={review.rating || 0} readOnly />
                      </div>
                      {review.comment && <p className="mt-1 text-xs text-gray-600">{review.comment}</p>}
                    </div>
                  ))}
                </div>
                <Link to={`/product/${product._id}`} onClick={onClose} className="mt-2 inline-block text-xs font-semibold text-pink-600 hover:text-pink-700">
                  See all {reviews.length} reviews
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Related products */}
        {relatedLoading ? (
          <div className="px-6 pb-6">
            <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
            <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-40 animate-pulse rounded-2xl bg-gray-100" />
              ))}
            </div>
          </div>
        ) : related.length > 0 ? (
          <div className="border-t border-gray-100 px-6 pb-6 pt-4">
            <h3 className="font-serif text-lg font-bold text-gray-900">You May Also Like</h3>
            <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
              {related.map((rel) => {
                const main = rel.images?.find((img) => img.isMain) || rel.images?.[0];
                return (
                  <Link
                    key={rel._id}
                    to={`/product/${rel._id}`}
                    onClick={onClose}
                    className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-lg"
                  >
                    {main?.url ? (
                      <img src={getCloudinaryOptimizedUrl(main.url, 400)} alt={rel.name} className="h-32 w-full object-cover" />
                    ) : (
                      <div className="flex h-32 w-full items-center justify-center bg-gray-100 text-3xl text-gray-300">👗</div>
                    )}
                    <div className="p-3">
                      <p className="line-clamp-2 text-sm font-semibold text-gray-900">{rel.name}</p>
                      <p className="mt-1 text-sm font-bold text-pink-600">Rs. {rel.price}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default QuickViewModal;
