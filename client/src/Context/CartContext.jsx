import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../Services/api';
import { useAuth } from './Authcontext';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

// Normalize a server cart item (cart.product populated) into a frontend cart item
const normalizeServerItem = (cartItem) => {
  const product = cartItem.product;
  if (!product) return null;
  const variantSku = cartItem.variantSku || null;
  const variant = product.variants?.find(
    (v) => (v.sku && v.sku === variantSku) || (v._id && v._id.toString() === variantSku)
  ) || null;

  const price = variant?.price ?? product.price;
  const image = variant?.images?.[0]?.url || product.images?.[0]?.url || '/placeholder.jpg';
  const stock = variant?.stock ?? product.stock;

  return {
    key: variantSku ? `${product._id}:${variantSku}` : `${product._id}`,
    productId: product._id,
    name: product.name,
    price,
    image,
    quantity: Math.min(cartItem.quantity, stock || cartItem.quantity),
    stock,
    variant: variant ? { sku: variant.sku || variant._id, attributes: variant.attributes } : null,
  };
};

const GUEST_CART_KEY = 'guest_cart';

export const CartProvider = ({ children }) => {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  // Tracks the previous auth state so we can detect logout transitions and
  // avoid persisting an authenticated user's cart into the guest store.
  const prevAuthRef = useRef(isAuthenticated);

  const fetchServerCart = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/users/profile/cart');
      const serverItems = (data.cart || [])
        .map(normalizeServerItem)
        .filter(Boolean);

      // Merge guest cart into the server cart ONLY when the guest actually has
      // items. New users (no guest items) simply get their (empty) server cart.
      let guestItems = [];
      try {
        guestItems = JSON.parse(localStorage.getItem(GUEST_CART_KEY) || '[]');
      } catch (e) {
        guestItems = [];
      }

      if (Array.isArray(guestItems) && guestItems.length) {
        await Promise.all(
          guestItems.map((item) =>
            api.post('/users/profile/cart', {
              productId: item.productId,
              quantity: item.quantity,
              variantSku: item.variant?.sku || item.variantSku || null,
            })
          )
        );
        const refreshed = await api.get('/users/profile/cart');
        setCartItems(
          (refreshed.data.cart || []).map(normalizeServerItem).filter(Boolean)
        );
        localStorage.removeItem(GUEST_CART_KEY);
      } else {
        setCartItems(serverItems);
      }
    } catch (error) {
      console.error('Failed to load server cart:', error);
      // Keep the cart empty rather than showing stale guest data.
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Core auth-state effect:
  // - While auth is still loading (e.g. restoring a persisted session on
  //   page reload) do nothing so we never treat an authenticated user as a
  //   guest and load stale localStorage cart data.
  // - On logout transition, reset everything.
  // - Authenticated: fetch the user's real server cart (new users → empty).
  // - Guest: load the guest cart from localStorage.
  useEffect(() => {
    if (authLoading) return;

    const wasAuthenticated = prevAuthRef.current;
    prevAuthRef.current = isAuthenticated;

    // Logout transition: clear the cart completely so the next user starts
    // clean. Never re-load guest storage here.
    if (wasAuthenticated && !isAuthenticated) {
      setCartItems([]);
      localStorage.removeItem(GUEST_CART_KEY);
      localStorage.removeItem('cart'); // legacy cleanup
      return;
    }

    if (isAuthenticated && user?._id) {
      // A newly logged-in user always starts from their server cart. The
      // guest cart is only merged in if it actually has items.
      setCartItems([]);
      fetchServerCart();
      return;
    }

    if (!isAuthenticated) {
      // Genuine guest session: load the guest cart (empty for new visitors).
      const savedCart = localStorage.getItem(GUEST_CART_KEY);
      if (savedCart) {
        try {
          const parsed = JSON.parse(savedCart);
          setCartItems(Array.isArray(parsed) ? parsed : []);
        } catch (e) {
          setCartItems([]);
        }
      } else {
        setCartItems([]);
      }
    }
  }, [authLoading, isAuthenticated, user?._id, fetchServerCart]);

  // Persist the cart to localStorage ONLY for genuine guest sessions. We skip
  // the logout transition so a stale authenticated cart never leaks into the
  // guest store for the next user.
  const persistAuthRef = useRef(isAuthenticated);
  useEffect(() => {
    if (authLoading) return;

    const wasAuthenticated = persistAuthRef.current;
    persistAuthRef.current = isAuthenticated;

    if (!isAuthenticated && !wasAuthenticated) {
      if (cartItems.length > 0) {
        localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cartItems));
      } else {
        localStorage.removeItem(GUEST_CART_KEY);
      }
    }
  }, [authLoading, cartItems, isAuthenticated]);

  // Calculate totals
  useEffect(() => {
    const items = cartItems.reduce((acc, item) => acc + item.quantity, 0);
    const price = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    setTotalItems(items);
    setTotalPrice(price);
  }, [cartItems]);

const addToCart = useCallback(
    (product, quantity = 1, variant = null) => {
      // Adding to cart requires authentication. Guests must log in first so
      // a new customer always starts with a clean, empty cart.
      if (!isAuthenticated) {
        toast.error('Please login to add items to your cart');
        return false;
      }

      const variantSku = variant?.sku || variant?._id || null;
      const key = variantSku ? `${product._id}:${variantSku}` : `${product._id}`;
      const price = variant?.price ?? product.price;
      const image = variant?.images?.[0]?.url || product.images?.[0]?.url || '/placeholder.jpg';
      const stock = variant?.stock ?? product.stock;

      const newItem = {
        key,
        productId: product._id,
        name: product.name,
        price,
        image,
        quantity: Math.min(quantity, stock || quantity),
        stock,
        variant: variant ? { sku: variant.sku || variant._id, attributes: variant.attributes } : null,
      };

      // Sync to server
      api
        .post('/users/profile/cart', { productId: product._id, quantity, variantSku })
        .then(({ data }) => {
          setCartItems((data.cart || []).map(normalizeServerItem).filter(Boolean));
        })
        .catch((error) => toast.error(error.response?.data?.message || 'Unable to add to cart'));
      toast.success('Added to cart!');
      return true;
    },
    [isAuthenticated]
  );

  const removeFromCart = useCallback(
    (key) => {
      setCartItems((prev) => prev.filter((item) => item.key !== key));
      if (isAuthenticated) {
        api
          .delete(`/users/profile/cart/${key}`)
          .catch(() => toast.error('Unable to remove item'));
      }
      toast.success('Removed from cart');
    },
    [isAuthenticated]
  );

  const updateQuantity = useCallback(
    (key, quantity) => {
      if (quantity < 1) {
        removeFromCart(key);
        return;
      }
      setCartItems((prev) =>
        prev.map((item) =>
          item.key === key ? { ...item, quantity: Math.min(quantity, item.stock) } : item
        )
      );
      if (isAuthenticated) {
        api
          .put(`/users/profile/cart/${key}`, { quantity })
          .catch(() => toast.error('Unable to update quantity'));
      }
    },
    [isAuthenticated, removeFromCart]
  );

  const clearCart = useCallback(() => {
    setCartItems([]);
    if (isAuthenticated) {
      api.delete('/users/profile/cart').catch(() => {});
    }
    localStorage.removeItem(GUEST_CART_KEY);
    toast.success('Cart cleared');
  }, [isAuthenticated]);

  const value = {
    cartItems,
    loading,
    totalItems,
    totalPrice,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
