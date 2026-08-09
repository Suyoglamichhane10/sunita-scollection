import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../Services/api';
import { FaEye, FaTimes } from 'react-icons/fa';

const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled'];

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updating, setUpdating] = useState(false);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/orders');
      setOrders(data.orders);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateOrder = async (orderId, updates) => {
    setUpdating(true);
    try {
      const { data } = await api.put(`/orders/${orderId}/status`, updates);
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...data.order, user: o.user } : o)));
      if (selectedOrder?._id === orderId) setSelectedOrder((prev) => ({ ...prev, ...data.order }));
      toast.success('Order updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update order');
    } finally {
      setUpdating(false);
    }
  };

  const filtered = orders.filter((order) => {
    const matchesStatus = statusFilter === 'all' || order.orderStatus === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      (order.orderNumber || '').toLowerCase().includes(q) ||
      (order.user?.name || '').toLowerCase().includes(q) ||
      (order.trackingNumber || '').toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const statusColor = (status) => {
    const map = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-indigo-100 text-indigo-800',
      packed: 'bg-purple-100 text-purple-800',
      shipped: 'bg-cyan-100 text-cyan-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return map[status] || 'bg-gray-100 text-gray-800';
  };

  const paymentColor = (status) => {
    return status === 'paid'
      ? 'bg-green-100 text-green-800'
      : status === 'refunded'
      ? 'bg-red-100 text-red-800'
      : 'bg-yellow-100 text-yellow-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom px-4 lg:px-8">
        <section className="bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
              <p className="mt-1 text-sm text-gray-600">Filter, update status, and track all customer orders.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search order #, customer, tracking..."
                className="w-64 rounded-full border border-gray-300 px-4 py-2 text-sm outline-none focus:border-pink-600"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-full border border-gray-300 px-4 py-2 text-sm outline-none focus:border-pink-600"
              >
                <option value="all">All statuses</option>
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-gray-500">
                <tr>
                  <th className="px-3 py-3">Order #</th>
                  <th className="px-3 py-3">Customer</th>
                  <th className="px-3 py-3">Total</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Payment</th>
                  <th className="px-3 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className="p-8 text-center text-gray-500">Loading orders...</td></tr>
                ) : filtered.length ? (
                  filtered.map((order) => (
                    <tr key={order._id} className="border-b border-gray-100">
                      <td className="px-3 py-3 font-medium text-gray-900">{order.orderNumber}</td>
                      <td className="px-3 py-3 text-gray-600">{order.user?.name || 'Guest'}</td>
                      <td className="px-3 py-3 text-gray-600">Rs. {order.totalAmount}</td>
                      <td className="px-3 py-3">
                        <select
                          value={order.orderStatus}
                          onChange={(e) => updateOrder(order._id, { orderStatus: e.target.value })}
                          disabled={updating}
                          className={`rounded-full border border-gray-200 px-3 py-1 text-sm ${statusColor(order.orderStatus)}`}
                        >
                          {ORDER_STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${paymentColor(order.paymentStatus)}`}>{order.paymentStatus}</span>
                      </td>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                          <FaEye /> Details
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="6" className="p-8 text-center text-gray-500">No orders found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedOrder(null)}>
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Order {selectedOrder.orderNumber}</h2>
              <button type="button" onClick={() => setSelectedOrder(null)} className="rounded-full p-2 text-gray-500 hover:bg-gray-100">
                <FaTimes />
              </button>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 p-4">
                <p className="text-sm font-semibold text-gray-500">Shipping address</p>
                <p className="mt-2 font-semibold text-gray-900">{selectedOrder.shippingAddress?.fullName}</p>
                <p className="text-sm text-gray-600">{selectedOrder.shippingAddress?.phone}</p>
                <p className="text-sm text-gray-600">{selectedOrder.shippingAddress?.street}, {selectedOrder.shippingAddress?.city}</p>
                <p className="text-sm text-gray-600">{selectedOrder.shippingAddress?.state}, {selectedOrder.shippingAddress?.country}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 p-4">
                <p className="text-sm font-semibold text-gray-500">Payment</p>
                <p className="mt-2 text-sm text-gray-600">Method: <span className="uppercase">{selectedOrder.paymentMethod}</span></p>
                <p className="text-sm text-gray-600">Status: <span className="uppercase">{selectedOrder.paymentStatus}</span></p>
                {selectedOrder.paymentDetails?.transactionId && (
                  <p className="text-sm text-gray-600">Txn: {selectedOrder.paymentDetails.transactionId}</p>
                )}
                <p className="mt-2 text-sm text-gray-600">Placed: {new Date(selectedOrder.createdAt).toLocaleString()}</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-gray-200 p-4">
              <p className="text-sm font-semibold text-gray-500">Status workflow</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {ORDER_STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => updateOrder(selectedOrder._id, { orderStatus: s })}
                    disabled={updating}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${selectedOrder.orderStatus === s ? 'bg-pink-600 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-100'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-700">Tracking number</label>
                <input
                  type="text"
                  defaultValue={selectedOrder.trackingNumber || ''}
                  onBlur={(e) => updateOrder(selectedOrder._id, { trackingNumber: e.target.value })}
                  placeholder="Add tracking number"
                  className="mt-2 w-full rounded-full border border-gray-300 px-4 py-2 text-sm outline-none focus:border-pink-600"
                />
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-gray-200 p-4">
              <p className="text-sm font-semibold text-gray-500">Items</p>
              <div className="mt-3 space-y-3">
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 rounded-xl bg-gray-50 p-3">
                    <img src={item.image || ''} alt={item.name} className="h-14 w-14 rounded-lg object-cover" />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{item.name}</p>
                      {item.variantTitle && <p className="text-sm text-gray-500">{item.variantTitle}</p>}
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-gray-900">Rs. {item.total}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-6 border-t border-gray-200 pt-4 text-sm">
              <span className="text-gray-600">Subtotal: <strong>Rs. {selectedOrder.subtotal}</strong></span>
              <span className="text-gray-600">Tax: <strong>Rs. {selectedOrder.tax}</strong></span>
              <span className="text-gray-600">Shipping: <strong>{selectedOrder.shippingCost ? `Rs. ${selectedOrder.shippingCost}` : 'Free'}</strong></span>
              <span className="text-lg font-bold text-gray-900">Total: Rs. {selectedOrder.totalAmount}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
