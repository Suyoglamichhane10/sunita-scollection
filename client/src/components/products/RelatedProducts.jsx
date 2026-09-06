import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../Services/api';
import { useCart } from '../../Context/CartContext';
import { useAuth } from '../../Context/Authcontext';
import { getCloudinaryOptimizedUrl, handleImageError } from '../../utils/imageOptimizer';

const RelatedProducts = ({ productId }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const { data } = await api.get(`/products/related/${productId}`);
        if (active) setProducts(data.products || []);
      } catch (error) {
        if (active) console.error('Failed to load related products:', error);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [productId]);

  const handleAdd = (product) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const variant = product.variants?.[0] || null;
    addToCart(product, 1, variant);
  };

  if (loading) {
    return (
      <div className="mt-10">
        <h2 className="font-serif text-2xl font-bold text-gray-900">You May Also Like</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-3xl border border-gray-200 bg-gray-50 p-4">
              <div className="h-48 w-full rounded-2xl bg-gray-200" />
              <div className="mt-4 space-y-3">
                <div className="h-4 w-3/4 rounded bg-gray-200" />
                <div className="h-4 w-1/2 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!products.length) {
    return null;
  }

  return (
    <div className="mt-12">
      <h2 className="font-serif text-2xl font-bold text-gray-900">You May Also Like</h2>
      <p className="mt-1 text-sm text-gray-500">More styles from the same collection.</p>
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {products.map((product) => {
          const mainImage = product.images?.find((img) => img.isMain) || product.images?.[0];
          const variant = product.variants?.[0] || null;
          const price = variant?.price ?? product.price;
          const stock = variant?.stock ?? product.stock;
          const isOutOfStock = stock === 0;

          return (
            <div key={product._id} className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:shadow-lg">
              <Link to={`/product/${product._id}`} className="relative block">
                {mainImage?.url ? (
                  <img src={getCloudinaryOptimizedUrl(mainImage.url, 600)} alt={product.name} className="h-48 w-full object-cover" onError={handleImageError} />
                ) : (
                  <div className="flex h-48 w-full items-center justify-center bg-gray-100 text-4xl text-gray-300">👗</div>
                )}
                {isOutOfStock && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <span className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-gray-900">Out of Stock</span>
                  </div>
                )}
              </Link>
              <div className="p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{product.category?.name || "Women's fashion"}</p>
                <Link to={`/product/${product._id}`}>
                  <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-gray-900 hover:text-pink-600">{product.name}</h3>
                </Link>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-base font-bold text-gray-900">Rs. {price}</span>
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => handleAdd(product)}
                    className="rounded-full bg-pink-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    {isOutOfStock ? 'Sold out' : 'Add'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RelatedProducts;
