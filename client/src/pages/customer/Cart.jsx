import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../Context/CartContext';

const Cart = () => {
  const { cartItems, totalItems, totalPrice, updateQuantity, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();
  const shippingCost = totalPrice >= 1000 ? 0 : 100;
  const tax = Math.round(totalPrice * 0.05);
  const orderTotal = totalPrice + tax + shippingCost;

  if (!cartItems.length) {
    return (
      <div className="min-h-screen bg-gray-50 py-20">
        <div className="container-custom px-4 lg:px-8">
          <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-900">Your cart is empty</h2>
            <p className="mt-3 text-gray-600">Add some beautiful pieces to your collection.</p>
            <button
              onClick={() => navigate('/shop')}
              className="mt-6 rounded-full bg-pink-600 px-6 py-3 text-white transition hover:bg-pink-700"
            >
              Shop women's products
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container-custom grid gap-10 lg:grid-cols-[1.2fr_0.8fr] px-4 lg:px-8">
        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">Your Cart</h1>
          <p className="mt-2 text-gray-600">Review your selected items before checkout.</p>

          <div className="mt-8 space-y-6">
            {cartItems.map((item) => (
              <div key={item.key} className="grid gap-4 rounded-3xl border border-gray-200 p-5 md:grid-cols-[140px_1fr_auto]">
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-36 w-full rounded-3xl object-cover md:h-full"
                />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{item.name}</h2>
                  {item.variant && (
                    <p className="mt-1 text-sm text-gray-600">Variant: {item.variant.sku || Object.values(item.variant.attributes || {}).join(' / ')}</p>
                  )}
                  <p className="mt-2 text-sm text-gray-600">Rs. {item.price} each</p>
                  <p className="mt-1 text-sm text-gray-600">Stock: {item.stock}</p>
                  <div className="mt-4 flex items-center gap-3">
                    <button
                      onClick={() => updateQuantity(item.key, item.quantity - 1)}
                      className="rounded-full border border-gray-300 px-3 py-1 text-gray-600 hover:bg-gray-100"
                    >
                      -
                    </button>
                    <span className="min-w-[36px] text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.key, item.quantity + 1)}
                      className="rounded-full border border-gray-300 px-3 py-1 text-gray-600 hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="flex flex-col justify-between gap-4 text-right">
                  <p className="text-lg font-semibold text-gray-900">Rs. {item.price * item.quantity}</p>
                  <button
                    onClick={() => removeFromCart(item.key)}
                    className="text-sm font-semibold text-pink-600 hover:text-pink-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">Order Summary</h2>
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between text-gray-600">
              <span>Items</span>
              <span>{totalItems}</span>
            </div>
            <div className="flex items-center justify-between text-gray-600">
              <span>Subtotal</span>
              <span>Rs. {totalPrice}</span>
            </div>
            <div className="flex items-center justify-between text-gray-600">
              <span>Shipping</span>
              <span>{shippingCost ? `Rs. ${shippingCost}` : 'Free'}</span>
            </div>
            <div className="flex items-center justify-between text-gray-600">
              <span>Estimated tax</span>
              <span>Rs. {tax}</span>
            </div>
            <div className="flex items-center justify-between text-gray-900 font-semibold text-lg">
              <span>Total</span>
              <span>Rs. {orderTotal}</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/checkout')}
            className="mt-8 w-full rounded-full bg-pink-600 px-6 py-3 text-white transition hover:bg-pink-700"
          >
            Proceed to Checkout
          </button>
          <button
            onClick={clearCart}
            className="mt-4 w-full rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
          >
            Clear Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
