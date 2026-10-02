import React, { useState } from 'react';
import {
  FaPhoneAlt,
  FaCheckCircle,
  FaTag,
  FaPaperPlane,
  FaTrashAlt,
  FaThumbsUp,
  FaShare,
  FaSyncAlt,
  FaPhone,
  FaTimes,
  FaExchangeAlt,
} from 'react-icons/fa';
import api from '../../Services/api';

const SUPPORT_NUMBERS = ['9765562128', '9845423800'];

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'price_shared', label: 'Price Shared' },
  { value: 'negotiating', label: 'Negotiating' },
  { value: 'customer_agreed', label: 'Customer Agreed' },
  { value: 'deal_closed', label: 'Deal Closed' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'converted', label: 'Converted' },
  { value: 'approved', label: 'Approved' },
  { value: 'replied', label: 'Replied' },
];

const EnquiryReplyPanel = ({ enquiry, onUpdated, loading, onDelete }) => {
  const [message, setMessage] = useState('');
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [callOpen, setCallOpen] = useState(false);
  const [agreeing, setAgreeing] = useState(false);

  const [expandedAction, setExpandedAction] = useState(null);
  const [actionPrice, setActionPrice] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [callResult, setCallResult] = useState(null);
  const [statusValue, setStatusValue] = useState('');

  const suggestedReply = enquiry
    ? enquiry.suggestedReply || `Hello ${enquiry.name || 'Customer'}, thank you for your interest in ${enquiry.productName || 'the product'}. The price for this product is Rs. ______ including delivery. Please confirm if you would like to proceed. If you have any questions, feel free to reply here or call us at our contact number.`
    : '';

  React.useEffect(() => {
    if (!enquiry) return;
    if (!message) setMessage(suggestedReply);
  }, [enquiry]);

  if (!enquiry) return null;

  const hasQuoted = enquiry.quotedPrice != null && enquiry.quotedPrice > 0;
  const hasDeal = enquiry.status === 'deal_closed' || enquiry.status === 'converted';

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const resetActionForm = () => {
    setExpandedAction(null);
    setActionPrice('');
    setActionMessage('');
    setError('');
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    setError('');
    if (!message.trim()) {
      setError('Reply message is required');
      return;
    }
    const p = price === '' ? null : Number(price);
    if (p !== null && (!Number.isFinite(p) || p < 0)) {
      setError('Invalid price');
      return;
    }
    const payload = { message: message.trim() };
    if (p !== null) payload.price = p;
    try {
      const { data } = await api.post(`/enquiries/${enquiry._id}/reply`, payload);
      setMessage('');
      setPrice('');
      onUpdated(data.enquiry);
      showToast('Reply sent successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reply');
    }
  };

  const handleAgree = async () => {
    setAgreeing(true);
    setError('');
    try {
      const { data } = await api.post(`/enquiries/${enquiry._id}/agree`);
      onUpdated(data.enquiry);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register agreement');
    } finally {
      setAgreeing(false);
    }
  };

  const handleSharePrice = async (e) => {
    e.preventDefault();
    const p = Number(actionPrice);
    if (!Number.isFinite(p) || p <= 0) {
      setError('Valid price is required');
      return;
    }
    setActionLoading('share-price');
    setError('');
    try {
      const { data } = await api.post(`/enquiries/${enquiry._id}/share-price`, {
        price: p,
        message: actionMessage.trim() || 'Price shared',
      });
      onUpdated(data.enquiry);
      showToast('Price shared with customer');
      resetActionForm();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to share price');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuggestPrice = async (e) => {
    e.preventDefault();
    const p = Number(actionPrice);
    if (!Number.isFinite(p) || p <= 0) {
      setError('Valid price is required');
      return;
    }
    setActionLoading('suggest-price');
    setError('');
    try {
      const { data } = await api.post(`/enquiries/${enquiry._id}/suggest-price`, {
        price: p,
        message: actionMessage.trim() || 'Consider this price',
      });
      onUpdated(data.enquiry);
      showToast('Suggested new price to customer');
      resetActionForm();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to suggest price');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCallToConfirm = async () => {
    setActionLoading('call');
    setError('');
    try {
      const { data } = await api.post(`/enquiries/${enquiry._id}/call`);
      onUpdated(data.enquiry);
      setCallResult(data.phoneNumber || enquiry.phone);
      showToast('Call reminder sent to customer');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send call reminder');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateFinalPrice = async (e) => {
    e.preventDefault();
    const p = Number(actionPrice);
    if (!Number.isFinite(p) || p < 0) {
      setError('Valid deal price is required');
      return;
    }
    setActionLoading('final-price');
    setError('');
    try {
      const { data } = await api.post(`/enquiries/${enquiry._id}/update-final-price`, {
        price: p,
        message: actionMessage.trim() || 'Final price confirmed',
      });
      onUpdated(data.enquiry);
      showToast('Final price updated - deal closed');
      resetActionForm();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update final price');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!window.confirm('Are you sure you want to reject this enquiry?')) return;
    setActionLoading('reject');
    setError('');
    try {
      const { data } = await api.post(`/enquiries/${enquiry._id}/reject`, {
        message: actionMessage.trim() || 'We are unable to proceed with this enquiry.',
      });
      onUpdated(data.enquiry);
      showToast('Enquiry rejected');
      resetActionForm();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject enquiry');
    } finally {
      setActionLoading(null);
    }
  };

  const handleChangeStatus = async (e) => {
    e.preventDefault();
    if (!statusValue) return;
    if (!window.confirm(`Change status to "${STATUS_OPTIONS.find((s) => s.value === statusValue)?.label || statusValue}"?`))
      return;
    setActionLoading('status');
    setError('');
    try {
      const { data } = await api.put(`/enquiries/${enquiry._id}/status`, {
        status: statusValue,
      });
      onUpdated(data.enquiry);
      showToast(
        `Status changed to ${STATUS_OPTIONS.find((s) => s.value === statusValue)?.label || statusValue}`,
      );
      setStatusValue('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this enquiry?')) return;
    try {
      await api.delete(`/enquiries/${enquiry._id}`);
      onUpdated(null);
      showToast('Enquiry deleted');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete enquiry');
    }
  };

  const toggleExpand = (action) => {
    setExpandedAction((prev) => (prev === action ? null : action));
    setActionPrice('');
    setActionMessage('');
    setError('');
  };

  const btnBase =
    'min-h-[44px] rounded-xl border border-gold/40 bg-gold/20 px-4 py-2 text-xs font-semibold text-primary transition hover:bg-gold/35 disabled:opacity-50 flex items-center gap-1';

  return (
    <div className="rounded-xl border border-gold/30 bg-white p-4">
      <h5 className="mb-3 text-sm font-semibold text-primary">Reply to Enquiry</h5>
      {hasQuoted && (
        <p className="mb-2 text-xs font-semibold text-pink-600 flex items-center gap-1">
          <FaTag className="h-3 w-3" /> Quoted Price: Rs. {enquiry.quotedPrice}
        </p>
      )}
      {enquiry.counterPrice && (
        <p className="mb-2 text-xs font-semibold text-orange-600">
          Counter Offer: Rs. {enquiry.counterPrice}
        </p>
      )}
      {enquiry.dealPrice && (
        <p className="mb-2 text-xs font-semibold text-purple-600 flex items-center gap-1">
          <FaCheckCircle className="h-3 w-3" /> Deal Closed: Rs. {enquiry.dealPrice}
        </p>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleAgree}
          disabled={loading || agreeing}
          className={btnBase}
          title="Register agreement for this enquiry"
        >
          <FaThumbsUp className="h-3 w-3" />
          {agreeing ? 'Saving...' : `Agree (${enquiry.agreeCount || 0})`}
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setCallOpen((v) => !v)}
            className="min-h-[44px] rounded-xl bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-200 flex items-center gap-1"
            aria-expanded={callOpen}
            title="Show support numbers"
          >
            <FaPhoneAlt className="h-3 w-3" />
            Call
          </button>
          {callOpen && (
            <div className="absolute left-0 z-30 mt-2 w-56 rounded-xl border border-gold/30 bg-white p-2 shadow-xl">
              <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Instant support
              </p>
              {SUPPORT_NUMBERS.map((num) => (
                <a
                  key={num}
                  href={`tel:${num}`}
                  onClick={() => setCallOpen(false)}
                  className="flex min-h-[44px] items-center gap-2 rounded-lg px-2 py-2 text-sm text-gray-700 transition hover:bg-gold/20"
                >
                  <FaPhoneAlt className="h-3 w-3 text-primary" />
                  {num}
                </a>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => toggleExpand('share-price')}
          disabled={loading || hasDeal}
          className={btnBase}
          title="Share a price with the customer"
        >
          <FaShare className="h-3 w-3" />
          Share Price
        </button>

        <button
          type="button"
          onClick={() => toggleExpand('suggest-price')}
          disabled={loading || hasDeal}
          className={btnBase}
          title="Suggest a counter price to the customer"
        >
          <FaSyncAlt className="h-3 w-3" />
          Suggest Price
        </button>

        <button
          type="button"
          onClick={() => toggleExpand('final-price')}
          disabled={loading || hasDeal}
          className={btnBase}
          title="Set the final deal price and close"
        >
          <FaTag className="h-3 w-3" />
          Final Price
        </button>

        <button
          type="button"
          onClick={() => toggleExpand('reject')}
          disabled={loading || hasDeal}
          className="min-h-[44px] rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50 flex items-center gap-1"
          title="Reject this enquiry"
        >
          <FaTimes className="h-3 w-3" />
          Reject
        </button>

        <button
          type="button"
          onClick={handleCallToConfirm}
          disabled={loading || actionLoading === 'call' || hasDeal}
          className="min-h-[44px] rounded-xl bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-200 disabled:opacity-50 flex items-center gap-1"
          title="Send a call-to-confirm reminder to the customer"
        >
          <FaPhone className="h-3 w-3" />
          {actionLoading === 'call' ? 'Calling...' : 'Call to Confirm'}
        </button>
      </div>

      {callResult && (
        <p className="mb-2 text-xs text-gray-700">
          Customer phone:
          <a href={`tel:${callResult}`} className="ml-1 font-semibold text-primary underline">
            {callResult}
          </a>
        </p>
      )}

      <div className="mb-3 flex flex-wrap items-end gap-2">
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            Change Status
          </label>
          <select
            value={statusValue}
            onChange={(e) => setStatusValue(e.target.value)}
            disabled={loading || actionLoading === 'status'}
            className="w-48 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-100"
          >
            <option value="">Select a status…</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={handleChangeStatus}
          disabled={loading || actionLoading === 'status' || !statusValue}
          className="min-h-[44px] rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary-700 disabled:opacity-50 flex items-center gap-1"
          title="Apply the selected status to this enquiry"
        >
          <FaExchangeAlt className="h-3 w-3" />
          {actionLoading === 'status' ? 'Saving...' : 'Apply'}
        </button>
      </div>

      {expandedAction && (
        <form
          className="mb-3 space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-3"
          onSubmit={(e) => {
            if (expandedAction === 'share-price') return handleSharePrice(e);
            if (expandedAction === 'suggest-price') return handleSuggestPrice(e);
            if (expandedAction === 'final-price') return handleUpdateFinalPrice(e);
            if (expandedAction === 'reject') return handleReject(e);
            return e.preventDefault();
          }}
        >
          {expandedAction !== 'reject' && (
            <div>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={actionPrice}
                onChange={(e) => setActionPrice(e.target.value)}
                placeholder="Enter price (Rs.)"
                disabled={actionLoading === expandedAction}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-100 disabled:opacity-50"
              />
            </div>
          )}
          <div>
            <textarea
              value={actionMessage}
              onChange={(e) => setActionMessage(e.target.value)}
              rows={3}
              placeholder="Message (optional - default will be used)"
              disabled={actionLoading === expandedAction}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-100 disabled:opacity-50"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={actionLoading === expandedAction || loading}
              className="min-h-[44px] flex-1 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-1"
            >
              <FaPaperPlane className="h-3 w-3" />
              {actionLoading === expandedAction ? 'Saving...' : 'Confirm'}
            </button>
            <button
              type="button"
              onClick={resetActionForm}
              disabled={actionLoading === expandedAction || loading}
              className="min-h-[44px] flex-1 rounded-xl bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-200 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {!hasDeal && (
        <form className="space-y-3" onSubmit={handleSendReply}>
          <div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Type your reply..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-100"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Price (optional)"
              className="w-36 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-100"
            />
            <button
              type="submit"
              disabled={loading}
              className="min-h-[44px] rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary-700 disabled:opacity-50 flex items-center gap-1"
            >
              <FaPaperPlane className="h-3 w-3" /> Send Reply
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="min-h-[44px] rounded-xl bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50 flex items-center gap-1"
            >
              <FaTrashAlt className="h-3 w-3" /> Delete
            </button>
          </div>
        </form>
      )}

      {hasDeal && (
        <p className="mt-2 text-xs text-gray-500">
          This enquiry is closed. No further replies needed.
        </p>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {toast && (
        <div
          className="fixed bottom-4 right-4 z-50 rounded-xl bg-gray-900 px-4 py-2 text-xs text-white shadow-xl animate-fade-in"
          role="alert"
        >
          {toast}
        </div>
      )}
    </div>
  );
};

export default EnquiryReplyPanel;
