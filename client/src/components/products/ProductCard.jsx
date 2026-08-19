import React from 'react';
import { Link } from 'react-router-dom';

const ProductCard = ({ product }) => {
  const mainImage = product.images?.find((img) => img.isMain) || product.images?.[0];
  const threshold = product.lowStockThreshold || 5;
  const isLowStock = product.stock > 0 && product.stock <= threshold;
  const isOutOfStock = product.stock === 0;

  const getStockBadge = () => {
    if (isOutOfStock) {
      return (
        <span className="absolute left-3 top-3 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
          Out of Stock
        </span>
      );
    }
    if (isLowStock) {
      return (
        <span className="absolute left-3 top-3 rounded-full bg-yellow-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
          Only {product.stock} left
        </span>
      );
    }
    return null;
  };

  const getDiscountPercentage = () => {
    if (product.comparePrice && product.comparePrice > product.price) {
      const discount = Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100);
      return discount;
    }
    return 0;
  };

  const discount = getDiscountPercentage();

  return (
    <div className="group relative overflow-hidden rounded-lg bg-white shadow-sm transition-all duration-300 hover:shadow-xl">
      {/* Image Container */}
      <Link to={`/product/${product._id}`} className="relative block aspect-[3/4] overflow-hidden bg-gray-100">
        {mainImage ? (
          <img
            src={mainImage.url}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
            <span className="text-4xl text-gray-400">👗</span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-2">
          {getStockBadge()}
          {product.isFeatured && (
            <span className="rounded-full bg-gold-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
              ★ Featured
            </span>
          )}
          {discount > 0 && (
            <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
              -{discount}%
            </span>
          )}
        </div>

        {/* Quick Actions */}
        <div className="absolute right-3 top-3 flex flex-col gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <button
            className="rounded-full bg-white p-2 shadow-lg transition hover:bg-gold-50"
            title="Add to wishlist"
          >
            <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-gray-900">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      {/* Product Info */}
      <div className="p-4">
        {/* Category */}
        {product.category && (
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">
            {product.category.name}
          </p>
        )}

        {/* Product Name */}
        <Link to={`/product/${product._id}`}>
          <h3 className="mb-2 line-clamp-2 text-base font-semibold text-gray-900 transition-colors hover:text-primary-600">
            {product.name}
          </h3>
        </Link>

        {/* Brand */}
        {product.brand && (
          <p className="mb-2 text-xs text-gray-500">{product.brand}</p>
        )}

        {/* Rating */}
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

        {/* Price */}
        <div className="mb-3 flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900">Rs. {product.price}</span>
          {product.comparePrice && product.comparePrice > product.price && (
            <span className="text-sm text-gray-500 line-through">Rs. {product.comparePrice}</span>
          )}
        </div>

        {/* Stock Info */}
        <div className="mb-3 flex items-center gap-2">
          {isOutOfStock ? (
            <span className="text-xs font-medium text-red-600">Out of Stock</span>
          ) : isLowStock ? (
            <span className="text-xs font-medium text-yellow-600">⚠ Only {product.stock} left</span>
          ) : (
            <span className="text-xs font-medium text-green-600">✓ In Stock ({product.stock} available)</span>
          )}
        </div>

        {/* Variants Count */}
        {(product.variants?.length || 0) > 0 && (
          <p className="text-xs text-gray-500">
            {product.variants.length} variant{product.variants.length > 1 ? 's' : ''} available
          </p>
        )}

        {/* Add to Cart Button */}
        <button
          disabled={isOutOfStock}
          className={`mt-4 w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
            isOutOfStock
              ? 'cursor-not-allowed bg-gray-200 text-gray-500'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;