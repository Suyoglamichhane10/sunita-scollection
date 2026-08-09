import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../Services/api';
import { useAuth } from '../../Context/Authcontext';
import toast from 'react-hot-toast';

const Wishlist = () => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchWishlist = async () => {
      try {
        const { data } = await api.get('/users/profile/wishlist');
        setWishlist(data.wishlist);
      } catch (error) {
        console.error(error);
        toast.error('Unable to load wishlist');
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [authLoading, isAuthenticated, navigate]);

  const removeItem = async (productId) => {
    try {
      const { data } = await api.delete(`/users/profile/wishlist/${productId}`);
      setWishlist(data.wishlist);
      toast.success('Removed from wishlist');
    } catch (error) {
      toast.error('Unable to remove item');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container-custom px-4 lg:px-8">
        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">Wishlist</h1>
          <p className="mt-2 text-gray-600">Save favorite products and come back later.</p>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {loading ? (
              <div className="col-span-full rounded-3xl border border-gray-200 bg-gray-50 p-10 text-center">Loading wishlist...</div>
            ) : wishlist.length ? (
              wishlist.map((product) => (
                <div key={product._id} className="rounded-3xl border border-gray-200 bg-white shadow-sm">
                  <img
                    src={product.images?.[0]?.url || 'https://via.placeholder.com/400x400?text=Product'}
                    alt={product.name}
                    className="h-64 w-full object-cover rounded-t-3xl"
                  />
                  <div className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900">{product.name}</h2>
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">{product.description}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-lg font-bold text-pink-600">Rs. {product.price}</span>
                      <button
                        type="button"
                        onClick={() => removeItem(product._id)}
                        className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        Remove
                      </button>
                    </div>
                    <Link
                      to={`/product/${product._id}`}
                      className="mt-4 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700"
                    >
                      View product
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full rounded-3xl border border-gray-200 bg-gray-50 p-10 text-center">
                <h2 className="text-xl font-semibold text-gray-900">Your wishlist is empty</h2>
                <p className="mt-3 text-gray-600">Save products while browsing and find them here later.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wishlist;
