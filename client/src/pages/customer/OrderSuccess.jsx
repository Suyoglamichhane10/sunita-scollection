import React, { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { FaCheckCircle } from 'react-icons/fa';
import api from '../../Services/api';
import { useCart } from '../../Context/CartContext';
import toast from 'react-hot-toast';

const OrderSuccess = () => {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { clearCart } = useCart();

  // eSewa / Khalti callback params
  const isEsewaCallback = searchParams.get('refId') || searchParams.get('oid');
  const isKhaltiCallback = searchParams.get('pidx');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // If redirected from eSewa with refId, verify payment.
        // eSewa redirects back with the parameter `transaction_uuid` (snake_case).
        const txnId = searchParams.get('transaction_uuid') || searchParams.get('transactionUuid') || searchParams.get('oid');
        if (orderId && isEsewaCallback) {
          await api.post('/payments/esewa/verify', { orderId, transactionUuid: txnId });
          toast.success('Payment confirmed via eSewa!');
          clearCart();
        }
        // If redirected from Khalti with pidx, verify payment
        if (orderId && isKhaltiCallback) {
          const pidx = searchParams.get('pidx');
          await api.post('/payments/khalti/verify', { orderId, pidx });
          toast.success('Payment confirmed via Khalti!');
          clearCart();
        }

        if (orderId) {
          const { data } = await api.get(`/orders/${orderId}`);
          setOrder(data.order);
        }
      } catch (error) {
        console.error(error);
        toast.error(error.response?.data?.message || 'Unable to load order');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [orderId, isEsewaCallback, isKhaltiCallback, clearCart]);

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container-custom px-4 lg:px-8">
        <div className="mx-auto max-w-2xl rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-5xl text-green-600">
            <FaCheckCircle />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEsewaCallback || isKhaltiCallback ? 'Payment Successful!' : 'Order Placed Successfully!'}
          </h1>
          <p className="mt-3 text-gray-600">
            Thank you for shopping with Sunita's Collection. We've received your order and will process it shortly.
          </p>

          {loading ? (
            <div className="mt-8 rounded-3xl border border-gray-200 bg-gray-50 p-6 text-gray-600">Loading order details...</div>
          ) : order ? (
            <div className="mt-8 space-y-4 rounded-3xl border border-gray-200 bg-gray-50 p-6 text-left">
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
          ) : (
            <div className="mt-8 rounded-3xl border border-gray-200 bg-gray-50 p-6 text-gray-600">
              Order details are loading. You can view your orders from the My Orders page.
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/orders" className="rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
              View My Orders
            </Link>
            <Link to="/shop" className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
