import React, { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../Services/api';
import { useCart } from '../../Context/CartContext';
import toast from 'react-hot-toast';

const OrderSuccess = () => {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { clearCart } = useCart();

// Callback detection
  const isEsewaCallback = searchParams.get('refId') || searchParams.get('oid') || searchParams.get('transaction_uuid');
  const isKhaltiCallback = searchParams.get('pidx');
  const isStripeCallback = searchParams.get('gateway') === 'stripe';

  useEffect(() => {
    let cancelled = false;

    const pollOrder = async (attempts = 0) => {
      // Stripe confirmation is async (arrives via webhook). Poll the order
      // until it is marked paid/confirmed, up to ~15s.
      const maxAttempts = 15;
      try {
        const { data } = await api.get(`/orders/${orderId}`);
        if (data.order.isPaid && data.order.orderStatus === 'confirmed') {
          if (!cancelled) {
            toast.success('Payment confirmed via Stripe!');
            clearCart();
            setOrder(data.order);
          }
          return;
        }
        if (data.order.paymentStatus === 'failed' || data.order.orderStatus === 'cancelled') {
          if (!cancelled) navigate(`/payment-failure/${orderId}`, { replace: true });
          return;
        }
        if (attempts < maxAttempts) {
          setTimeout(() => pollOrder(attempts + 1), 1000);
        }
      } catch (error) {
        if (!cancelled) {
          console.error(error);
          navigate(`/payment-failure/${orderId}`, { replace: true });
        }
      }
    };

    const verifyPayment = async () => {
      try {
        // If redirected from eSewa, verify via our eSewa verify endpoint.
        const txnId = searchParams.get('transaction_uuid') || searchParams.get('transactionUuid') || searchParams.get('oid');
        if (orderId && isEsewaCallback) {
          const res = await api.post('/payments/esewa/verify', { orderId, transactionUuid: txnId });
          if (!res.data.success) {
            navigate(`/payment-failure/${orderId}`, { replace: true });
            return;
          }
          toast.success('Payment confirmed via eSewa!');
          clearCart();
        }

        // If redirected from Khalti, verify via our Khalti verify endpoint.
        if (orderId && isKhaltiCallback) {
          const pidx = searchParams.get('pidx');
          const res = await api.post('/payments/khalti/verify', { orderId, pidx });
          if (!res.data.success) {
            navigate(`/payment-failure/${orderId}`, { replace: true });
            return;
          }
          toast.success('Payment confirmed via Khalti!');
          clearCart();
        }

        if (orderId) {
          if (isStripeCallback) {
            // Stripe is confirmed asynchronously via webhook — poll for it.
            await pollOrder(0);
          } else {
            const { data } = await api.get(`/orders/${orderId}`);
            // If the order ended up failed/cancelled after a callback, show failure page.
            if (data.order.paymentStatus === 'failed' || data.order.orderStatus === 'cancelled') {
              navigate(`/payment-failure/${orderId}`, { replace: true });
              return;
            }
            setOrder(data.order);
          }
        }
      } catch (error) {
        console.error(error);
        const msg = error.response?.data?.message || 'Unable to load order';
        // On verification failure (payment not confirmed/timeout), show failure page
        if (orderId && (isEsewaCallback || isKhaltiCallback)) {
          navigate(`/payment-failure/${orderId}`, { replace: true });
        } else {
          toast.error(msg);
        }
      } finally {
        if (!isStripeCallback) setLoading(false);
      }
    };

    verifyPayment();

    return () => {
      cancelled = true;
    };
  }, [orderId, isEsewaCallback, isKhaltiCallback, isStripeCallback, clearCart, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom px-4 lg:px-8">
        <div className="mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          {/* Success Icon */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-10 w-10 text-green-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          {/* Heading */}
          <h1 className="text-3xl font-bold text-gray-900">
            Order Placed Successfully!
          </h1>

          {/* Subtitle */}
          <p className="mt-3 text-gray-600">
            Thank you for shopping with us. We've received your order and will process it shortly.
          </p>

          {/* Order Details Card */}
          {loading ? (
            <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-6 text-gray-600">
              Loading order details...
            </div>
          ) : order ? (
            <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-6 text-left">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Order number</span>
                  <span className="font-semibold text-gray-900">{order.orderNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total amount</span>
                  <span className="font-semibold text-gray-900">Rs. {order.totalAmount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Payment method</span>
                  <span className="font-semibold text-gray-900">{order.paymentMethod?.toUpperCase()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Payment status</span>
                  <span className={`font-semibold ${order.isPaid ? 'text-green-600' : 'text-amber-600'}`}>
                    {order.isPaid ? 'Paid' : 'Pending'}
                  </span>
                </div>
                {order.paymentDetails?.transactionId && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Transaction ID</span>
                    <span className="font-mono text-sm font-semibold text-blue-600">{order.paymentDetails.transactionId}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Delivery estimate</span>
                  <span className="font-semibold text-gray-900">3-5 business days</span>
                </div>
                {order.trackingNumber && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Tracking number</span>
                    <span className="font-semibold text-blue-600">{order.trackingNumber}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-6 text-gray-600">
              Order details are loading. You can view your orders from the My Orders page.
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/orders"
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              View My Orders
            </Link>
            <Link
              to="/shop"
              className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
