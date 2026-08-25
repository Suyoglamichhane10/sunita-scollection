import React from 'react';
import { useCompare } from '../../Context/CompareContext';
import { FaTimes, FaShoppingBag } from 'react-icons/fa';
import { useCart } from '../../Context/CartContext';
import { useAuth } from '../../Context/Authcontext';
import { Link } from 'react-router-dom';

const ProductCompare = ({ isOpen, onClose }) => {
  const { items, removeFromCompare, clearCompare } = useCompare();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  if (!isOpen) return null;

  const handleAddToCart = (product) => {
    if (!isAuthenticated) return;
    const variant = product.variants?.[0] || null;
    addToCart(product, 1, variant);
  };

  const attributes = [];
  items.forEach((product) => {
    if (product.specifications) {
      Object.keys(product.specifications).forEach((key) => {
        if (!attributes.includes(key)) attributes.push(key);
      });
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="relative max-h-[90vh] max-w-6xl w-full overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h3 className="text-xl font-bold text-gray-900">Compare Products ({items.length})</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-x-auto p-6">
          {items.length === 0 ? (
            <div className="py-10 text-center text-gray-500">No products to compare. Add products from product pages.</div>
          ) : (
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-3 text-left font-semibold text-gray-700 w-40"></th>
                  {items.map((product) => (
                    <th key={product._id} className="pb-3 px-4 text-center">
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-gray-900 line-clamp-2">{product.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFromCompare(product._id)}
                          className="ml-2 text-gray-400 hover:text-red-500"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-4 font-medium text-gray-700">Image</td>
                  {items.map((product) => (
                    <td key={product._id} className="py-4 px-4 text-center">
                      <img
                        src={product.images?.[0]?.url || 'https://via.placeholder.com/150x150?text=Product'}
                        alt={product.name}
                        className="mx-auto h-32 w-32 rounded-xl object-cover"
                      />
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 font-medium text-gray-700">Price</td>
                  {items.map((product) => (
                    <td key={product._id} className="py-4 px-4 text-center font-bold text-pink-600">
                      Rs. {product.price}
                      {product.comparePrice && product.comparePrice > product.price && (
                        <div className="text-xs text-gray-400 line-through">Rs. {product.comparePrice}</div>
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 font-medium text-gray-700">Stock</td>
                  {items.map((product) => (
                    <td key={product._id} className="py-4 px-4 text-center">
                      <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
                        product.stock === 0 ? 'bg-red-100 text-red-700' : product.stock <= (product.lowStockThreshold || 5) ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {product.stock === 0 ? 'Out of Stock' : product.stock <= (product.lowStockThreshold || 5) ? `Low Stock (${product.stock})` : `In Stock (${product.stock})`}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 font-medium text-gray-700">Brand</td>
                  {items.map((product) => (
                    <td key={product._id} className="py-4 px-4 text-center text-gray-600">
                      {product.brand || '-'}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 font-medium text-gray-700">Category</td>
                  {items.map((product) => (
                    <td key={product._id} className="py-4 px-4 text-center text-gray-600">
                      {product.category?.name || '-'}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 font-medium text-gray-700">Rating</td>
                  {items.map((product) => (
                    <td key={product._id} className="py-4 px-4 text-center">
                      {product.rating?.average ? (
                        <div className="flex items-center justify-center gap-1">
                          <span className="font-bold text-gray-900">{product.rating.average}</span>
                          <span className="text-xs text-gray-500">({product.rating.count})</span>
                        </div>
                      ) : '-'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-4 font-medium text-gray-700">Action</td>
                  {items.map((product) => (
                    <td key={product._id} className="py-4 px-4 text-center">
                      <Link
                        to={`/product/${product._id}`}
                        onClick={onClose}
                        className="mb-2 inline-block rounded-full bg-pink-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-pink-700"
                      >
                        View Details
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleAddToCart(product)}
                        disabled={product.stock === 0}
                        className="ml-2 rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <FaShoppingBag className="mr-1 inline" />
                        Add to Cart
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-gray-200 px-6 py-4 flex justify-end">
            <button
              type="button"
              onClick={clearCompare}
              className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Clear All
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCompare;
