import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../Services/api';
import { useCart } from '../../Context/CartContext';
import { useAuth } from '../../Context/Authcontext';
import { FaCheck, FaTruck, FaTimes, FaMapMarkerAlt, FaFileInvoice, FaRedo } from 'react-icons/fa';

const ORDER_FLOW = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered'];
const ORDER_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-indigo-100 text-indigo-700',
  packed: 'bg-purple-100 text-purple-700',
  shipped: 'bg-cyan-100 text-cyan-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const StatusTimeline = ({ status }) => {
  if (status === 'cancelled') {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
        This order was cancelled.
      </div>
    );
  }
  const currentIndex = ORDER_FLOW.indexOf(status);

  return (
    <div className="my-6 overflow-x-auto">
      <div className="flex items-center min-w-[500px]">
        {ORDER_FLOW.map((step, index) => (
          <React.Fragment key={step}>
            {index > 0 && (
              <div className={`h-1 flex-1 rounded ${index <= currentIndex ? 'bg-pink-600' : 'bg-gray-200'}`} />
            )}
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                  index <= currentIndex ? 'bg-pink-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {index < currentIndex ? <FaCheck /> : index === currentIndex ? <FaTruck /> : index + 1}
              </div>
              <span className={`mt-2 hidden text-[10px] font-medium uppercase tracking-wide sm:block ${index <= currentIndex ? 'text-pink-700' : 'text-gray-400'}`}>
                {step}
              </span>
            </div>
          </React.Fragment>
        ))}
      </div>
      <div className="mt-3 flex justify-between sm:hidden">
        <span className="text-[10px] font-semibold uppercase text-pink-700">{status}</span>
      </div>
    </div>
  );
};

const Orders = () => {
  const { addToCart } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      return;
    }

    setCancellingOrderId(orderId);
    try {
      const { data } = await api.put(`/orders/${orderId}/cancel`);
      if (data.success) {
        setOrders(orders.map(order => 
          order._id === orderId ? data.order : order
        ));
        alert('Order cancelled successfully. Stock has been restored.');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert(error.response?.data?.message || 'Failed to cancel order. Please try again.');
    } finally {
      setCancellingOrderId(null);
    }
  };

  const handleDownloadInvoice = async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}/invoice`, { responseType: 'text' });
      const blob = new Blob([response.data], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, '_blank');
      if (!win) {
        alert('Please allow popups to download the invoice');
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to load invoice');
    }
  };

  const handleReorder = async (order) => {
    try {
      for (const item of order.items || []) {
        await addToCart(
          {
            _id: item.product,
            name: item.name,
            price: item.price,
            image: item.image,
            stock: 999,
            variants: item.variantSku ? [{ sku: item.variantSku }] : [],
          },
          item.quantity,
          item.variantSku ? { sku: item.variantSku } : null
        );
      }
      navigate('/cart');
    } catch (error) {
      console.error('Reorder failed:', error);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        const { data } = await api.get('/orders/my-orders');
        setOrders(data.orders);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [authLoading, isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container-custom px-4 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
        <p className="mt-2 text-gray-600">Track your latest purchases and delivery status.</p>

        <div className="mt-10 space-y-6">
          {loading ? (
            <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">Loading orders...</div>
          ) : !orders.length ? (
            <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900">No orders yet</h2>
              <p className="mt-3 text-gray-600">Place an order to see it here.</p>
              <button onClick={() => navigate('/shop')} className="mt-6 rounded-full bg-pink-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-pink-700">
                Start Shopping
              </button>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order._id} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Order {order.orderNumber}</h2>
                    <p className="mt-1 text-sm text-gray-600">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className={`rounded-full px-4 py-2 text-sm font-semibold ${ORDER_COLORS[order.orderStatus] || 'bg-gray-100 text-gray-700'}`}>
                    {order.orderStatus}
                  </div>
                </div>

                <StatusTimeline status={order.orderStatus} />

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-sm text-gray-600">Payment</p>
                    <p className="mt-1 text-gray-900">{order.paymentMethod?.toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payment status</p>
                    <p className={`mt-1 font-medium ${order.isPaid ? 'text-green-600' : 'text-amber-600'}`}>{order.paymentStatus}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="mt-1 text-gray-900">Rs. {order.totalAmount}</p>
                  </div>
                  {order.trackingNumber && (
                    <div>
                      <p className="text-sm text-gray-600">Tracking</p>
                      <p className="mt-1 font-medium text-blue-600">{order.trackingNumber}</p>
                    </div>
                  )}
                </div>

                {order.items && order.items.length > 0 && (
                  <div className="mt-6 space-y-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4 rounded-3xl bg-gray-50 p-4">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="h-16 w-16 rounded-2xl object-cover" />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-200 text-gray-400">No img</div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-gray-900">{item.name}</p>
                          {item.variantTitle && <p className="text-xs text-gray-500">{item.variantTitle}</p>}
                          <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">Rs. {item.total}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 grid grid-cols-1 gap-3 rounded-3xl bg-gray-50 p-4 text-sm text-gray-700 sm:grid-cols-2">
                  <div>
                    <p className="font-semibold text-gray-900">Shipping to</p>
                    <p className="mt-1">{order.shippingAddress?.street}, {order.shippingAddress?.city}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Phone</p>
                    <p className="mt-1">{order.shippingAddress?.phone}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {(order.orderStatus === 'pending' || order.orderStatus === 'confirmed') && (
                    <div>
                      <button
                        onClick={() => handleCancelOrder(order._id)}
                        disabled={cancellingOrderId === order._id}
                        className="flex h-10 items-center gap-2 rounded-full border border-red-300 bg-white px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <FaTimes />
                        {cancellingOrderId === order._id ? 'Cancelling...' : 'Cancel Order'}
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => navigate(`/track-order/${order._id}`)}
                    className="flex h-10 items-center gap-2 rounded-full bg-pink-600 px-4 text-sm font-semibold text-white transition hover:bg-pink-700"
                  >
                    <FaMapMarkerAlt /> Track Order
                  </button>
                  <button
                    onClick={() => handleDownloadInvoice(order._id)}
                    className="flex h-10 items-center gap-2 rounded-full border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    <FaFileInvoice /> Invoice
                  </button>
                  <button
                    onClick={() => handleReorder(order)}
                    className="flex h-10 items-center gap-2 rounded-full border border-blue-300 bg-white px-4 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
                  >
                    <FaRedo /> Reorder
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Orders;
