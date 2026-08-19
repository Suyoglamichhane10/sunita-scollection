import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { FaTimesCircle } from 'react-icons/fa';
import api from '../../Services/api';
import toast from 'react-hot-toast';

const PaymentFailure = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        if (orderId) {
          const { data } = await api.get(`/orders/${orderId}`);
          setOrder(data.order);
        }
      } catch (error) {
        console.error(error);
        toast.error('Unable to load order details');
      } finally {
        setLoading(false);
      }
    };
    loadOrder();
  }, [orderId]);

  // Get error from URL query params
  const [searchParams] = useSearchParams();
  const errorType = searchParams.get('error');
  
  const getErrorMessage = () => {
    switch (errorType) {
      case 'missing_params':
        return 'Payment verification failed due to missing parameters.';
      case 'order_not_found':
        return 'Order not found. Please contact support.';
      case 'not_configured':
        return 'Payment gateway is not configured properly.';
      case 'verification_timeout':
        return 'Payment verification timed out. Please try again.';
      case 'payment_not_complete':
        return 'Payment was not completed successfully.';
      case 'server_error':
        return 'A server error occurred. Please try again.';
      default:
        return 'Your payment could not be completed. This can happen if you cancelled the payment, your transaction timed out, or the payment was declined. Your cart and order have not been charged.';
    }
  };

  const handleRetryPayment = async () => {
    if (!order) return;
    setRetrying(true);
    try {
      // Place a fresh attempt through the same gateway the customer chose.
      if (order.paymentMethod === 'esewa') {
        const esewaRes = await api.post('/payments/esewa/initiate', { orderId });
        const { paymentUrl, params } = esewaRes.data.data;
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = paymentUrl;
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
      if (order.paymentMethod === 'khalti') {
        const khaltiRes = await api.post('/payments/khalti/initiate', { orderId });
        const paymentUrl = khaltiRes.data.data.paymentUrl;
        if (paymentUrl) {
          window.location.href = paymentUrl;
          return;
        }
        toast.error('Unable to start Khalti payment');
      }
      // Fallback: go checkout to choose again
      navigate('/checkout');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to retry payment');
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container-custom px-4 lg:px-8">
        <div className="mx-auto max-w-2xl rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-5xl text-red-600">
            <FaTimesCircle />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Failed</h1>
          <p className="mt-3 text-gray-600">{getErrorMessage()}</p>

          {loading ? (
            <div className="mt-8 rounded-3xl border border-gray-200 bg-gray-50 p-6 text-gray-600">Loading order details...</div>
          ) : order ? (
            <div className="mt-8 space-y-3 rounded-3xl border border-gray-200 bg-gray-50 p-6 text-left">
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
                <span className="font-semibold text-red-600">Failed / Not completed</span>
              </div>
            </div>
          ) : (
            <div className="mt-8 rounded-3xl border border-gray-200 bg-gray-50 p-6 text-gray-600">
              We could not load your order. Please try again.
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={handleRetryPayment}
              disabled={retrying || !order}
              className="rounded-full bg-pink-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {retrying ? 'Redirecting to payment...' : 'Retry Payment'}
            </button>
            <Link
              to="/checkout"
              className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              Back to Checkout
            </Link>
            <Link
              to="/cart"
              className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              View Cart
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailure;
