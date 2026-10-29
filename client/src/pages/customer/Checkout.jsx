import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../../Context/CartContext';
import { useAuth } from '../../Context/Authcontext';
import api from '../../Services/api';
import toast from 'react-hot-toast';
import EsewaLogo from '../../assets/Esewa_logo.webp';
import FonepayLogo from '../../assets/fonepay.png';
import { FaAward } from 'react-icons/fa';
import {
  PHONE_ERROR_CLASS,
  PHONE_ERROR_MESSAGE,
  PHONE_INPUT_PROPS,
  isValidNepaliPhone,
  sanitizePhone,
} from '../../utils/validatePhone';

const Checkout = () => {
  const { cartItems, totalPrice, clearCart, refreshCart } = useCart();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [shipping, setShipping] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    country: 'Nepal',
  });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [phoneError, setPhoneError] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref') || '';
  const shippingCost = totalPrice >= 1000 ? 0 : 100;
  const tax = Math.round(totalPrice * 0.05);
  const totalAmount = totalPrice + tax + shippingCost;

  // Refresh cart on mount to pick up any new deal prices
  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  // Check if any cart item lacks a valid price
  const invalidItems = cartItems.filter((item) => !item.hasValidPrice);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handlePhoneChange = (e) => {
    const digits = sanitizePhone(e.target.value);
    setShipping((prev) => ({ ...prev, phone: digits }));
    if (phoneTouched) setPhoneError(!isValidNepaliPhone(digits));
  };

  const handlePhoneBlur = () => {
    setPhoneTouched(true);
    setPhoneError(!isValidNepaliPhone(shipping.phone));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cartItems.length) {
      toast.error('Your cart is empty');
      navigate('/cart');
      return;
    }

    // Prevent checkout if any item lacks a valid price
    if (invalidItems.length > 0) {
      const names = invalidItems.map((item) => item.name).join(', ');
      toast.error(`Cannot checkout: ${names} ${invalidItems.length === 1 ? 'has' : 'have'} no price. Please enquire first.`);
      navigate('/cart');
      return;
    }

    setPhoneTouched(true);
    if (!isValidNepaliPhone(shipping.phone)) {
      setPhoneError(true);
      return;
    }

     setIsSubmitting(true);

    const payload = {
      items: cartItems.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
        dealPrice: item.dealPrice != null && item.dealPrice !== '' ? Number(item.dealPrice) : null,
        price: Number(item.price || item.dealPrice || 0),
        variantSku: item.variant?.sku || null,
      })),
      shippingAddress: shipping,
      paymentMethod,
      ...(referralCode && { referralCode }),
    };
    console.log('Order Payload:', JSON.stringify(payload, null, 2));

    try {
      const response = await api.post('/orders', payload);
      const orderId = response.data.order?._id;

      if (paymentMethod === 'cod') {
        toast.success('Order placed successfully!');
        clearCart();
        navigate(`/order-success/${orderId}`);
        return;
      }

      if (paymentMethod === 'esewa') {
        const paymentUrl =
          response.data.paymentUrl ||
          response.data.url ||
          response.data.checkoutUrl ||
          response.data.data?.paymentUrl ||
          response.data.data?.url;
        if (paymentUrl) {
          window.location.href = paymentUrl;
          return;
        }
        if (orderId) {
          try {
            const esewaRes = await api.post('/payments/esewa/initiate', { orderId });
            const esewaPaymentUrl = esewaRes.data?.paymentUrl || esewaRes.data?.data?.paymentUrl;
            const params = esewaRes.data?.params || esewaRes.data?.data?.params;
            if (esewaPaymentUrl && params) {
              const form = document.createElement('form');
              form.method = 'POST';
              form.action = esewaPaymentUrl;
              form.id = 'esewa-form';
              Object.entries(params).forEach(([key, value]) => {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                input.value = value;
                form.appendChild(input);
              });
              document.body.appendChild(form);
              form.submit();
              return;
            }
            if (esewaPaymentUrl) {
              window.location.href = esewaPaymentUrl;
              return;
            }
          } catch (error) {
            if (error.response?.status === 503 && import.meta.env.MODE === 'development') {
              toast.success('Order placed successfully! (Development mode - eSewa bypassed)');
              clearCart();
              navigate(`/order-success/${orderId}`);
              return;
            }
          }
        }
        toast.error(response.data?.message || 'Unable to initiate eSewa payment');
        setIsSubmitting(false);
        return;
      }

      if (paymentMethod === 'fonepay') {
        const fonepayUrl =
          response.data.paymentUrl ||
          response.data.url ||
          response.data.checkoutUrl ||
          response.data.data?.paymentUrl ||
          response.data.data?.url;
        if (fonepayUrl) {
          window.location.href = fonepayUrl;
          return;
        }
        if (orderId) {
          try {
            const fonepayRes = await api.post('/payments/fonepay/initiate', { orderId });
            const fonepayPaymentUrl = fonepayRes.data?.paymentUrl || fonepayRes.data?.data?.paymentUrl || fonepayRes.data?.data?.checkoutUrl;
            if (fonepayPaymentUrl) {
              window.location.href = fonepayPaymentUrl;
              return;
            }
          } catch (error) {
            if (error.response?.status === 503 && import.meta.env.MODE === 'development') {
              toast.success('Order placed successfully! (Development mode - FonePay bypassed)');
              clearCart();
              navigate(`/order-success/${orderId}`);
              return;
            }
          }
        }
        toast.error(response.data?.message || 'Unable to initiate FonePay payment');
        setIsSubmitting(false);
        return;
      }

      // Fallback
      toast.success('Order placed successfully!');
      clearCart();
      navigate(`/order-success/${orderId}`);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to place order');
      console.error(error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container-custom px-4 lg:px-8">
        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="mt-2 text-gray-600">Fill in your shipping details and payment preference.</p>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <input
                type="text"
                placeholder="Full Name"
                value={shipping.fullName}
                onChange={(e) => setShipping({ ...shipping, fullName: e.target.value })}
                required
                className="w-full rounded-3xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
              />
              <div>
                <input
                  {...PHONE_INPUT_PROPS}
                  placeholder="Phone Number"
                  value={shipping.phone}
                  onChange={handlePhoneChange}
                  onBlur={handlePhoneBlur}
                  required
                  aria-invalid={phoneError}
                  className="w-full rounded-3xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                />
                {phoneError && (
                  <p className={PHONE_ERROR_CLASS}>{PHONE_ERROR_MESSAGE}</p>
                )}
              </div>
              <input
                type="text"
                placeholder="Street Address"
                value={shipping.street}
                onChange={(e) => setShipping({ ...shipping, street: e.target.value })}
                required
                className="w-full rounded-3xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
              />
              <input
                type="text"
                placeholder="City"
                value={shipping.city}
                onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                required
                className="w-full rounded-3xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
              />
              <input
                type="text"
                placeholder="State"
                value={shipping.state}
                onChange={(e) => setShipping({ ...shipping, state: e.target.value })}
                className="w-full rounded-3xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
              />
              <input
                type="text"
                placeholder="Country"
                value={shipping.country}
                onChange={(e) => setShipping({ ...shipping, country: e.target.value })}
                className="w-full rounded-3xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
              />
            </div>

                <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
                  <h2 className="text-lg font-semibold text-gray-900">Payment Method</h2>
                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                  {[
                    { id: 'cod', label: 'Cash on Delivery', desc: 'Pay when your order arrives', badge: 'COD', color: 'bg-gray-700', logo: null },
                    { id: 'esewa', label: 'eSewa', desc: 'Pay using your eSewa wallet', badge: 'ESEWA', color: 'bg-green-600', logo: EsewaLogo, recommended: true },
                    { id: 'fonepay', label: 'FonePay', desc: 'Pay using your FonePay wallet', badge: 'FONEPAY', color: 'bg-primary', logo: FonepayLogo },
                  ].map((method) => (
                    <label
                      key={method.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-3xl border p-4 transition ${paymentMethod === method.id ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white hover:border-primary/40'}`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        checked={paymentMethod === method.id}
                        onChange={() => setPaymentMethod(method.id)}
                        className="hidden"
                      />
                      {method.logo ? (
                        <img src={method.logo} alt={method.label} className="h-8 w-auto object-contain" />
                      ) : (
                        <div className={`rounded-full px-3 py-2 text-sm font-semibold text-white ${method.color}`}>
                          {method.badge}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">{method.label}</p>
                          {method.recommended && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                              <FaAward className="h-3 w-3" /> Recommended
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{method.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Order Summary</h3>
              {cartItems.map((item) => (
                <div key={item.key} className="flex items-center justify-between py-2 border-b border-gray-100 text-sm">
                  <span className="text-gray-700">{item.name} {item.variant ? `(${item.variant.sku || ''})` : ''} × {item.quantity}</span>
                  <span className="font-medium text-gray-900">
                    Rs. {(item.dealPrice || item.price) * item.quantity}
                    {item.dealPrice && (
                      <span className="ml-1 rounded-full bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700">Deal</span>
                    )}
                  </span>
                </div>
              ))}
              <div className="mt-3 flex items-center justify-between text-gray-600">
                <span>Subtotal</span>
                <span>Rs. {totalPrice.toLocaleString()}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-gray-600">
                <span>Estimated shipping</span>
                <span>{shippingCost ? `Rs. ${shippingCost}` : 'Free'}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-gray-600">
                <span>Estimated tax</span>
                <span>Rs. {tax.toLocaleString()}</span>
              </div>
              <div className="mt-4 border-t border-gray-200 pt-4 text-lg font-semibold text-gray-900">
                Total: Rs. {totalAmount.toLocaleString()}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-pink-600 px-6 py-4 text-sm font-semibold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                'Place Order'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Checkout;