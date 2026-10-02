import React, { useState } from 'react';
import { useCart } from '../../Context/CartContext';
import api from '../../Services/api';
import toast from 'react-hot-toast';
import { FaTruck, FaBan, FaTrash, FaRedo, FaDownload, FaCheck, FaTimes } from 'react-icons/fa';

const TRACK_STATUSES = ['processing', 'packed', 'shipped', 'out_for_delivery'];
const CANCEL_STATUSES = ['pending', 'confirmed', 'processing'];
const DELETE_STATUSES = ['cancelled', 'delivered'];

const OrderActions = ({ order, onOrdersChange }) => {
  const { addToCart } = useCart();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const canTrack = TRACK_STATUSES.includes(order.orderStatus);
  const canCancel = CANCEL_STATUSES.includes(order.orderStatus);
  const canDelete = DELETE_STATUSES.includes(order.orderStatus);

  const handleTrack = () => {
    window.open(`/track-order/${order._id}`, '_blank');
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) return toast.error('Please provide a reason');
    setActionLoading('cancel');
    try {
      const { data } = await api.put(`/orders/${order._id}/cancel`, { reason: cancelReason.trim() });
      toast.success('Order cancelled');
      if (onOrdersChange) onOrdersChange(data.order);
      setShowCancelModal(false);
      setCancelReason('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    setActionLoading('delete');
    try {
      await api.delete(`/orders/${order._id}`);
      toast.success('Order deleted');
      if (onOrdersChange) onOrdersChange({ ...order, isDeleted: true });
      setShowDeleteModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReorder = async () => {
    try {
      for (const item of order.items || []) {
        await addToCart(
          { _id: item.product, name: item.name, price: item.price, image: item.image, stock: 999, variants: item.variantSku ? [{ sku: item.variantSku }] : [] },
          item.quantity,
          item.variantSku ? { sku: item.variantSku } : null
        );
      }
      toast.success('Items added to cart');
      window.location.href = '/cart';
    } catch { toast.error('Reorder failed'); }
  };

  const handleInvoice = () => {
    window.open(`/orders/${order._id}/invoice`, '_blank');
  };

  if (!canTrack && !canCancel && !canDelete) return null;

  return (
    <div className="mt-3 pt-3 border-t border-gold/10 flex flex-wrap items-center gap-2">
      {canTrack && (
        <button
          onClick={handleTrack}
          className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-2.5 text-xs active:scale-95 font-semibold text-primary"
        >
          <FaTruck className="text-xs" /> Track
        </button>
      )}
      {canCancel && (
        <button
          onClick={() => setShowCancelModal(true)}
          disabled={actionLoading === 'cancel'}
          className="flex items-center gap-1 rounded-full bg-amber-100 px-3 py-2.5 text-xs active:scale-95 font-semibold text-amber-700 hover:bg-amber-200"
        >
          <FaBan className="text-xs" /> Cancel
        </button>
      )}
      {canDelete && (
        <button
          onClick={() => setShowDeleteModal(true)}
          disabled={actionLoading === 'delete'}
          className="flex items-center gap-1 rounded-full bg-red-100 px-3 py-2.5 text-xs active:scale-95 font-semibold text-red-700 hover:bg-red-200"
        >
          <FaTrash className="text-xs" /> Delete
        </button>
      )}
      <button
        onClick={handleReorder}
        className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-2.5 text-xs active:scale-95 font-semibold text-gray-700 hover:bg-gray-200"
      >
        <FaRedo className="text-xs" /> Reorder
      </button>
      {order.orderStatus === 'delivered' && (
        <button
          onClick={handleInvoice}
          className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-2.5 text-xs active:scale-95 font-semibold text-green-700 hover:bg-green-200"
        >
          <FaDownload className="text-xs" /> Invoice
        </button>
      )}

      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
          <div className="w-full max-h-[90vh] max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 shadow-xl sm:rounded-3xl">
            <h3 className="text-lg font-bold text-ink mb-4">Cancel Order {order.orderNumber}</h3>
            <p className="text-sm text-ink-light mb-4">Please provide a reason for cancellation:</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-ink focus:border-pink-500 focus:ring-1 focus:ring-pink-200"
              placeholder="Reason for cancellation..."
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => { setShowCancelModal(false); setCancelReason(''); }}
                className="rounded-full bg-gray-100 px-4 py-2.5 text-sm active:scale-95 font-semibold text-gray-700 hover:bg-gray-200"
              >
                <FaTimes className="mr-1 text-xs" /> No
              </button>
              <button
                onClick={handleCancel}
                disabled={actionLoading === 'cancel' || !cancelReason.trim()}
                className="rounded-full bg-red-600 px-4 py-2.5 text-sm active:scale-95 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                <FaCheck className="mr-1 text-xs" /> {actionLoading === 'cancel' ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
          <div className="w-full max-h-[90vh] max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 shadow-xl sm:rounded-3xl">
            <h3 className="text-lg font-bold text-ink mb-4">Delete Order {order.orderNumber}</h3>
            <p className="text-sm text-ink-light mb-4">This action cannot be undone. The order will be permanently removed from your history.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="rounded-full bg-gray-100 px-4 py-2.5 text-sm active:scale-95 font-semibold text-gray-700 hover:bg-gray-200"
              >
                <FaTimes className="mr-1 text-xs" /> No
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading === 'delete'}
                className="rounded-full bg-red-600 px-4 py-2.5 text-sm active:scale-95 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                <FaTrash className="mr-1 text-xs" /> {actionLoading === 'delete' ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderActions;