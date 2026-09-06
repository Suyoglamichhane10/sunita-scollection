import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaArrowsAltH } from 'react-icons/fa';
import { useCart } from '../../Context/CartContext';
import { useAuth } from '../../Context/Authcontext';
import { useWishlist } from '../../Context/WishlistContext';
import { useCompare } from '../../Context/CompareContext';
import { getCloudinaryOptimizedUrl, getMainImage, getVariantImage, handleImageError } from '../../utils/imageOptimizer';

const ProductCard = ({ product, onQuickView, compact = false }) => {
  const threshold = product.lowStockThreshold || 5;
  const isLowStock = product.stock > 0 && product.stock <= threshold;

  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { items: compareItems, addToCompare, removeFromCompare } = useCompare();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const inWishlist = isInWishlist(product._id);
  const inCompare = compareItems.some((p) => p._id === product._id);
  const variants = product.variants || [];
  const hasVariants = variants.length > 1;
  const getVariantColor = (v) => {
    if (!v.attributes) return '';
    if (typeof v.attributes.get === 'function') return v.attributes.get('color') || '';
    if (typeof v.attributes === 'object') return v.attributes.color || '';
    return '';
  };
  const purpleVariant = variants.find((v) => /purple/i.test(v.title || '') || /purple/i.test(getVariantColor(v)));
  const [selectedVariant, setSelectedVariant] = React.useState(purpleVariant || variants[0] || null);
  const [isHovering, setIsHovering] = React.useState(false);

  React.useEffect(() => {
    if (!hasVariants || isHovering) return;
    const timer = setInterval(() => {
      setSelectedVariant((prev) => {
        const currentVariants = product.variants || [];
        const idx = currentVariants.findIndex((v) => (v.sku || v._id) === (prev?.sku || prev?._id));
        return currentVariants[(idx + 1) % currentVariants.length];
      });
    }, 2500);
    return () => clearInterval(timer);
  }, [hasVariants, isHovering, product.variants]);

  const stock = selectedVariant?.stock ?? product.stock;
  const price = selectedVariant?.price ?? product.price;
  const cardOutOfStock = stock === 0;
  const displayImage = selectedVariant ? getVariantImage(selectedVariant, product.images) : getMainImage(product.images, product.name);

  const getStockBadge = () => {
    if (cardOutOfStock) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
          Out of Stock
        </span>
      );
    }
    if (isLowStock) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-bold text-yellow-700">
          <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
          Only {stock} left
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
        In Stock
      </span>
    );
  };

  const getCategoryBadges = () => {
    const badges = [];
    if (product.isNewArrival) badges.push({ label: 'New', cls: 'bg-emerald-500' });
    if (product.isBestSeller) badges.push({ label: 'Best Seller', cls: 'bg-rose-500' });
    if (product.isTrending) badges.push({ label: 'Trending', cls: 'bg-amber-500' });
    if (product.isRecommended) badges.push({ label: 'Recommended', cls: 'bg-violet-500' });
    return badges;
  };

  const getDiscountPercentage = () => {
    if (product.comparePrice && product.comparePrice > price) {
      const discount = Math.round(((product.comparePrice - price) / product.comparePrice) * 100);
      return discount;
    }
    return 0;
  };

  const discount = getDiscountPercentage();

  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    if (inWishlist) {
      await removeFromWishlist(product._id);
    } else {
      await addToWishlist(product._id);
    }
  };

  const handleAdd = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (cardOutOfStock) return;
    addToCart(product, 1, selectedVariant);
  };

  const handleDetails = (e) => {
    e.preventDefault();
    if (onQuickView) {
      onQuickView(product);
    } else {
      navigate(`/product/${product._id}`);
    }
  };

  const handleVariantClick = (v) => {
    setSelectedVariant(v);
  };

  const categoryBadges = getCategoryBadges();

  if (compact) {
    return (
      <div
        className="group flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-sm transition-shadow hover:shadow-md"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <Link to={`/product/${product._id}`} className="relative block aspect-[4/5] overflow-hidden bg-gray-100">
          {displayImage?.url ? (
            <img
              src={getCloudinaryOptimizedUrl(displayImage.url, 400)}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              onError={handleImageError}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
              <span className="text-3xl text-gray-400">👗</span>
            </div>
          )}

          <div className="absolute left-2 top-2 flex flex-col gap-1">
            {getStockBadge()}
            {categoryBadges.slice(0, 1).map((badge) => (
              <span key={badge.label} className={`rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow ${badge.cls}`}>
                {badge.label}
              </span>
            ))}
            {discount > 0 && (
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                -{discount}%
              </span>
            )}
          </div>

          <div className="absolute right-2 top-2 flex flex-col gap-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <button
              type="button"
              onClick={handleWishlistToggle}
              className={`rounded-full bg-white p-2 shadow transition ${
                inWishlist ? 'bg-red-500 text-white' : 'hover:bg-gold-50 text-gray-600'
              }`}
              title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <svg className="h-4 w-4" fill={inWishlist ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => inCompare ? removeFromCompare(product._id) : addToCompare(product)}
              className={`rounded-full bg-white p-2 shadow transition ${
                inCompare ? 'bg-gold-500 text-white' : 'hover:bg-gray-50 text-gray-600'
              }`}
              title={inCompare ? 'Remove from compare' : 'Add to compare'}
            >
              <FaArrowsAltH className="h-4 w-4" />
            </button>
          </div>

          {cardOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <span className="rounded-md bg-white px-3 py-1.5 text-xs font-bold text-gray-900">
                Out of Stock
              </span>
            </div>
          )}
        </Link>

        <div className="flex flex-1 flex-col p-3">
          {product.category && (
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">
              {product.category.name}
            </p>
          )}

          <Link to={`/product/${product._id}`}>
            <h3 className="line-clamp-2 text-sm font-bold text-gray-900 transition-colors hover:text-primary-600">
              {product.name}
            </h3>
          </Link>

          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-base font-bold text-gold-600">Rs. {price}</span>
            {product.comparePrice && product.comparePrice > price && (
              <span className="text-xs text-gray-500 line-through">Rs. {product.comparePrice}</span>
            )}
          </div>

          {!compact && hasVariants && (
            <div className="mt-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  {product.variants.length} variant{product.variants.length > 1 ? 's' : ''}
                </p>
                <span className="text-[10px] font-medium text-primary-600">
                  {isHovering ? 'Paused' : 'Auto-rotating'}
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {product.variants.slice(0, 4).map((v) => {
                  const active = selectedVariant && (selectedVariant.sku || selectedVariant._id) === (v.sku || v._id);
                  return (
                    <button
                      key={v.sku || v._id}
                      type="button"
                      onClick={() => handleVariantClick(v)}
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold transition ${
                        active ? 'border-pink-600 bg-pink-600 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-pink-300'
                      }`}
                    >
                      {v.title || Array.from(v.attributes || new Map()).map(([_k, val]) => val).join(' / ')}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-auto flex gap-2 pt-2">
            <button
              disabled={cardOutOfStock}
              onClick={handleAdd}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                cardOutOfStock
                  ? 'cursor-not-allowed bg-gray-200 text-gray-500'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              {cardOutOfStock ? 'Sold Out' : 'Add to Cart'}
            </button>
            <button
              type="button"
              onClick={handleDetails}
              className="flex items-center justify-center rounded-lg border border-primary-600 px-3 py-2 text-xs font-semibold text-primary-700 transition hover:bg-primary-50"
              title="View product details"
            >
              Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="group relative overflow-hidden rounded-lg bg-white shadow-sm transition-all duration-300 hover:shadow-xl"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <Link to={`/product/${product._id}`} className="relative block aspect-[3/4] overflow-hidden bg-gray-100">
        {displayImage?.url ? (
          <img
            src={getCloudinaryOptimizedUrl(displayImage.url, 600)}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={handleImageError}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
            <span className="text-4xl text-gray-400">👗</span>
          </div>
        )}

        <div className="absolute left-2 top-2 flex flex-col gap-1.5 sm:left-3 sm:top-3">
          {getStockBadge()}
          {categoryBadges.map((badge) => (
            <span
              key={badge.label}
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow-lg sm:px-3 sm:py-1 sm:text-xs ${badge.cls}`}
            >
              {badge.label}
            </span>
          ))}
          {product.isFeatured && (
            <span className="rounded-full bg-gold-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-lg sm:px-3 sm:py-1 sm:text-xs">
              ★ Featured
            </span>
          )}
          {discount > 0 && (
            <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-lg sm:px-3 sm:py-1 sm:text-xs">
              -{discount}%
            </span>
          )}
        </div>

        <div className="absolute right-3 top-3 flex flex-col gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <button
            type="button"
            onClick={handleWishlistToggle}
            className={`rounded-full bg-white p-2 shadow-lg transition ${
              inWishlist ? 'bg-red-500 text-white' : 'hover:bg-gold-50 text-gray-600'
            }`}
            title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <svg className="h-5 w-5" fill={inWishlist ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => inCompare ? removeFromCompare(product._id) : addToCompare(product)}
            className={`rounded-full bg-white p-2 shadow-lg transition ${
              inCompare ? 'bg-gold-500 text-white' : 'hover:bg-gray-50 text-gray-600'
            }`}
            title={inCompare ? 'Remove from compare' : 'Add to compare'}
          >
            <FaArrowsAltH />
          </button>
        </div>

        {cardOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-gray-900">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      <div className="p-4">
        {product.category && (
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">
            {product.category.name}
          </p>
        )}

        <Link to={`/product/${product._id}`}>
          <h3 className="mb-2 line-clamp-2 text-base font-bold text-gray-900 transition-colors hover:text-primary-600">
            {product.name}
          </h3>
        </Link>

        {product.brand && (
          <p className="mb-2 text-xs text-gray-500">{product.brand}</p>
        )}

        {product.rating?.count > 0 && (
          <div className="mb-2 flex items-center gap-1">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`h-4 w-4 ${i < Math.round(product.rating.average) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-300 text-gray-300'}`}
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-xs text-gray-500">({product.rating.count})</span>
          </div>
        )}

        <div className="mb-3 flex items-center gap-2">
          <span className="text-lg font-bold text-gold-600">Rs. {price}</span>
          {product.comparePrice && product.comparePrice > price && (
            <span className="text-sm text-gray-500 line-through">Rs. {product.comparePrice}</span>
          )}
        </div>

        <div className="mb-3 flex items-center gap-2">
          {cardOutOfStock ? (
            <span className="text-xs font-medium text-red-600">Out of Stock</span>
          ) : isLowStock ? (
            <span className="text-xs font-medium text-yellow-600">Only {stock} left</span>
          ) : (
            <span className="text-xs font-medium text-green-600">In Stock ({stock} available)</span>
          )}
        </div>

        {(product.variants?.length || 0) > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {product.variants.length} variant{product.variants.length > 1 ? 's' : ''} available
              </p>
              {hasVariants && (
                <span className="text-[10px] font-medium text-primary-600">
                  {isHovering ? 'Paused' : 'Auto-rotating'}
                </span>
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {product.variants.slice(0, 4).map((v) => {
                const active = selectedVariant && (selectedVariant.sku || selectedVariant._id) === (v.sku || v._id);
                return (
                  <button
                    key={v.sku || v._id}
                    type="button"
                    onClick={() => handleVariantClick(v)}
                    className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                      active ? 'border-pink-600 bg-pink-600 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-pink-300'
                    }`}
                  >
                    {v.title || Array.from(v.attributes || new Map()).map(([_k, val]) => val).join(' / ')}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            disabled={cardOutOfStock}
            onClick={handleAdd}
            className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
              cardOutOfStock
                ? 'cursor-not-allowed bg-gray-200 text-gray-500'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            {cardOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          </button>
          <button
            type="button"
            onClick={handleDetails}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-primary-600 px-4 py-2.5 text-sm font-semibold text-primary-700 transition hover:bg-primary-50"
            title="View product details"
          >
            Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
