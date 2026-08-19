import api from './api';

export const getWishlist = async () => {
  const { data } = await api.get('/wishlist');
  return data;
};

export const addToWishlist = async (productId, variantSku = null) => {
  const { data } = await api.post('/wishlist', { productId, variantSku });
  return data;
};

export const removeFromWishlist = async (productId, variantSku = null) => {
  const { data } = await api.delete(`/wishlist/${productId}?variantSku=${variantSku || ''}`);
  return data;
};

export const clearWishlist = async () => {
  const { data } = await api.delete('/wishlist');
  return data;
};

export default {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
};
