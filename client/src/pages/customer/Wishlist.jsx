import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../Services/api';
import wishlistApi from '../../Services/wishlistApi';
import { useAuth } from '../../Context/Authcontext';
import { FaHeart, FaShoppingCart, FaTimes, FaTrash } from 'react-icons/fa';
import { getCloudinaryOptimizedUrl, getAbsoluteImageUrl, handleImageError, getFallbackImage } from '../../utils/imageOptimizer';

const Wishlist = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchWishlist();
  }, [isAuthenticated, navigate]);

  const fetchWishlist = async () => {
    try {
      const { data } = await wishlistApi.getWishlist();
      setItems(data.wishlist?.items || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId, variantSku) => {
    try {
      await wishlistApi.removeFromWishlist(productId, variantSku);
      toast.success('Removed from wishlist');
      fetchWishlist();
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const handleClear = async () => {
    if (!window.confirm('Clear your entire wishlist?')) return;
    try {
      await wishlistApi.clearWishlist();
      toast.success('Wishlist cleared');
      setItems([]);
    } catch (error) {
      toast.error('Failed to clear wishlist');
    }
  };

  const handleAddToCart = async (item) => {
    try {
      await api.post('/cart', {
        productId: item.product?._id,
        quantity: 1,
        variantSku: item.variantSku,
      });
      toast.success('Added to cart');
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="container-custom px-4 lg:px-8">
          <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">Loading wishlist...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container-custom px-4 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
            <p className="mt-1 text-gray-600">Items you want to buy later</p>
          </div>
          {items.length > 0 && (
            <button onClick={handleClear} className="flex items-center gap-2 rounded-full border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50">
              <FaTrash /> Clear All
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <FaHeart className="mx-auto h-12 w-12 text-gray-300" />
            <h2 className="mt-4 text-xl font-semibold text-gray-900">Your wishlist is empty</h2>
            <p className="mt-3 text-gray-600">Save items you love so you can find them easily later.</p>
            <Link to="/shop" className="mt-6 inline-block rounded-full bg-pink-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-pink-700">
              Browse Shop
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <div key={`${item.product?._id}-${item.variantSku || ''}`} className="card-luxury overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <Link to={`/product/${item.product?._id}`} className="relative block">
                  {item.product?.images?.[0]?.url ? (
                    <img src={getAbsoluteImageUrl(getCloudinaryOptimizedUrl(item.product.images[0].url))} alt={item.product.name} className="h-56 w-full object-cover" onError={handleImageError} />
                  ) : (
                    <div className="flex h-56 w-full items-center justify-center bg-gray-100 text-gray-400">No image</div>
                  )}
                </Link>
                <div className="p-4">
                  <Link to={`/product/${item.product?._id}`} className="font-serif block text-lg font-bold text-gray-900 hover:text-pink-700">{item.product?.name}</Link>
                  {item.variantSku && (
                    <p className="mt-1 text-xs text-gray-500">Variant: {item.variantSku}</p>
                  )}
                  <p className="mt-2 text-lg font-bold text-pink-600">Rs. {item.product?.price}</p>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-full bg-pink-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-pink-700"
                    >
                      <FaShoppingCart /> Add to Cart
                    </button>
                    <button
                      onClick={() => handleRemove(item.product?._id, item.variantSku)}
                      className="flex items-center justify-center rounded-full border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      <FaTimes />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
