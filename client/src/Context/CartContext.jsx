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
  // Normalize the variant reference: prefer the SKU, fall back to the _id.
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

// Consolidate cart items by their unique key (productId + variantSku). This
// merges duplicate rows for the same product+variant into a single entry with
// the summed quantity (capped at available stock), preventing "bought one but
// shows many" / duplicate-rows issues.
const consolidateCartItems = (items) => {
  const map = new Map();
  for (const item of items) {
    const existing = map.get(item.key);
    if (existing) {
      const mergedQty = Math.min(existing.quantity + item.quantity, item.stock || (existing.stock || 1));
      existing.quantity = mergedQty;
      existing.stock = item.stock || existing.stock;
    } else {
      map.set(item.key, { ...item });
    }
  }
  return Array.from(map.values());
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
      const serverItems = consolidateCartItems(
        (data.cart || []).map(normalizeServerItem).filter(Boolean)
      );

      // Merge guest cart into the server cart ONLY when the guest actually has
      // items. New users (no guest items) simply get their (empty) server cart.
      let guestItems = [];
      try {
        guestItems = JSON.parse(localStorage.getItem(GUEST_CART_KEY) || '[]');
      } catch (e) {
        guestItems = [];
      }

      if (Array.isArray(guestItems) && guestItems.length) {
        // Consolidate the guest list first so duplicate product+variant rows
        // are merged into a single quantity before pushing to the server. This
        // prevents the guest→server merge from creating duplicate cart entries.
        const consolidatedGuest = consolidateCartItems(guestItems);
        await Promise.all(
          consolidatedGuest.map((item) =>
            api.post('/users/profile/cart', {
              productId: item.productId,
              quantity: item.quantity,
              variantSku: item.variant?.sku || item.variantSku || null,
            })
          )
        );
        const refreshed = await api.get('/users/profile/cart');
        setCartItems(
          consolidateCartItems(
            (refreshed.data.cart || []).map(normalizeServerItem).filter(Boolean)
          )
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

const sanitizedQty = Math.max(1, Math.floor(Number(quantity) || 1));
      const newItem = {
        key,
        productId: product._id,
        name: product.name,
        price,
        image,
        quantity: Math.min(sanitizedQty, stock || sanitizedQty),
        stock,
        variant: variant ? { sku: variant.sku || variant._id, attributes: variant.attributes } : null,
      };

      // Optimistic update: if the product+variant already exists in the cart,
      // bump its quantity instead of appending a duplicate row. This handles
      // the "add the same item twice should update quantity" case immediately.
      setCartItems((prev) => {
        const existing = prev.find((item) => item.key === key);
        if (existing) {
          const mergedQty = Math.min(existing.quantity + sanitizedQty, existing.stock || sanitizedQty);
          return prev.map((item) =>
            item.key === key ? { ...item, quantity: mergedQty } : item
          );
        }
        return consolidateCartItems([...prev, newItem]);
      });

      // Sync to server
      api
        .post('/users/profile/cart', { productId: product._id, quantity: sanitizedQty, variantSku })
        .then(({ data }) => {
          // Reconcile with the (consolidated) server response so the UI
          // always reflects the true, deduplicated cart state.
          setCartItems(
            consolidateCartItems(
              (data.cart || []).map(normalizeServerItem).filter(Boolean)
            )
          );
        })
        .catch((error) => {
          toast.error(error.response?.data?.message || 'Unable to add to cart');
          // Re-fetch the server cart on failure so the optimistic update does
          // not leave the UI out of sync with the backend.
          fetchServerCart();
        });
toast.success('Added to cart!');
      return true;
    },
    [isAuthenticated, fetchServerCart]
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
