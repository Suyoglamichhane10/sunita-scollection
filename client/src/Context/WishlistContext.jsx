import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../Services/api';
import { useAuth } from './Authcontext';

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const { data } = await api.get('/wishlist');
      setItems(data.wishlist?.items || []);
    } catch {
      // Silently fail for wishlist fetch
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const addToWishlist = async (productId, variantSku = null) => {
    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist');
      return false;
    }
    try {
      await api.post('/wishlist', { productId, variantSku });
      toast.success('Added to wishlist!');
      fetchWishlist();
      return true;
    } catch {
      toast.error('Failed to add to wishlist');
      return false;
    }
  };

  const removeFromWishlist = async (productId, variantSku = null) => {
    try {
      await api.delete(`/wishlist/${productId}?variantSku=${variantSku || ''}`);
      toast.success('Removed from wishlist');
      fetchWishlist();
    } catch {
      toast.error('Failed to remove from wishlist');
    }
  };

  const isInWishlist = (productId, variantSku = null) => {
    return items.some(
      (item) => item.product?._id === productId && (item.variantSku || '') === (variantSku || '')
    );
  };

  return (
    <WishlistContext.Provider value={{ items, loading, fetchWishlist, addToWishlist, removeFromWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export default WishlistProvider;
