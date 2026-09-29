import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../Services/api';
import { useCart } from '../../Context/CartContext';
import { useAuth } from '../../Context/Authcontext';
import { getCloudinaryOptimizedUrl, handleImageError } from '../../utils/imageOptimizer';
import { useApprovedProducts } from '../../hooks/useApprovedProducts';
import EnquiryModal from '../common/EnquiryModal';

const RelatedProducts = ({ productId }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [enquiryProduct, setEnquiryProduct] = useState(null);
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { isApproved, loading: approvedLoading } = useApprovedProducts();

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const { data } = await api.get(`/products/related/${productId}`);
        if (active) setProducts(data.products || []);
      } catch {
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

  const handleEnquire = (product) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setEnquiryProduct(product);
    setShowEnquiry(true);
  };

  if (loading) {
    return (
      <div className="mt-10">
        <h2 className="font-serif text-2xl font-bold text-gray-900">You May Also Like</h2>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-3xl border border-gray-200 bg-gray-50 p-4">
              <div className="aspect-square w-full rounded-2xl bg-gray-200" />
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
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => {
          const mainImage = product.images?.find((img) => img.isMain) || product.images?.[0];
          const variant = product.variants?.[0] || null;
          const stock = variant?.stock ?? product.stock;
          const isOutOfStock = stock === 0;
          const hasApproved = !approvedLoading && isApproved(product._id);

          return (
            <div key={product._id} className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:shadow-lg flex flex-col">
              <Link to={`/product/${product._id}`} className="relative block aspect-square overflow-hidden flex-shrink-0">
                {mainImage?.url ? (
                  <img src={getCloudinaryOptimizedUrl(mainImage.url, 600)} alt={product.name} className="h-full w-full object-cover" onError={handleImageError} />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                    <span className="text-4xl text-gray-300">👗</span>
                  </div>
                )}
                {isOutOfStock && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <span className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-gray-900">Out of Stock</span>
                  </div>
                )}
              </Link>
              <div className="flex flex-1 flex-col p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{product.category?.name || "Women's fashion"}</p>
                <Link to={`/product/${product._id}`}>
                  <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-gray-900 hover:text-pink-600">{product.name}</h3>
                </Link>
                <div className="mt-auto grid grid-cols-1 gap-2 sm:grid-cols-2 pt-4">
                  <div className="flex flex-col gap-2">
                    <span className="text-base font-bold text-gray-900 text-center">Contact for price</span>
                    {hasApproved ? (
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => handleAdd(product)}
                        className="rounded-full bg-pink-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                      >
                        {isOutOfStock ? 'Sold out' : 'Add'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleEnquire(product)}
                        className="rounded-full bg-pink-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                      >
                        Enquire
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <EnquiryModal product={enquiryProduct} isOpen={showEnquiry} onClose={() => { setShowEnquiry(false); setEnquiryProduct(null); }} />
    </div>
  );
};

export default RelatedProducts;