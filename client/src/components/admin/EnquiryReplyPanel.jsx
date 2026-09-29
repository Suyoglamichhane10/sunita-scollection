import React, { useState } from 'react';
import { FaPhoneAlt, FaCheckCircle, FaTag, FaPaperPlane, FaTrashAlt } from 'react-icons/fa';
import api from '../../Services/api';

const EnquiryReplyPanel = ({ enquiry, onUpdated, loading, onDelete }) => {
  const [message, setMessage] = useState('');
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  if (!enquiry) return null;

  const hasQuoted = enquiry.quotedPrice != null && enquiry.quotedPrice > 0;
  const hasDeal = enquiry.status === 'deal_closed' || enquiry.status === 'converted';
  const customerPhone = enquiry.phone || (enquiry.userId?.phone || '');
  const formattedPhone = customerPhone
    ? customerPhone.replace(/^(\+?977)?(\d{10})$/, '+977 $2').replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')
    : null;

  const suggestedReply = enquiry.suggestedReply || `Hello ${enquiry.name || 'Customer'}, thank you for your interest in ${enquiry.productName || 'the product'}. The price for this product is Rs. ______ including delivery. Please confirm if you would like to proceed. If you have any questions, feel free to reply here or call us at our contact number.`;

  React.useEffect(() => {
    if (!message) setMessage(suggestedReply);
  }, [enquiry]);

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
      setToast('Reply sent successfully');
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reply');
    }
  };

  const handleCall = () => {
    const rawPhone = enquiry.phone || (enquiry.userId?.phone || '');
    if (!rawPhone) {
      setToast('No phone number on this enquiry');
      setTimeout(() => setToast(null), 3000);
      return;
    }
    const cleanPhone = rawPhone.replace(/[\s\-+]/g, '');
    window.location.href = `tel:${cleanPhone}`;
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this enquiry?')) return;
    try {
      await api.delete(`/enquiries/${enquiry._id}`);
      onUpdated(null);
      setToast('Enquiry deleted');
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete enquiry');
    }
  };

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
              className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary-700 disabled:opacity-50 flex items-center gap-1"
            >
              <FaPaperPlane className="h-3 w-3" /> Send Reply
            </button>
            <button
              type="button"
              onClick={handleCall}
              disabled={loading || !customerPhone}
              className="rounded-xl bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              title={customerPhone ? `Call ${formattedPhone}` : 'No phone number available'}
            >
              <FaPhoneAlt className="h-3 w-3" />
              {customerPhone ? `Call ${formattedPhone}` : 'Call (No Number)'}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="rounded-xl bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50 flex items-center gap-1"
            >
              <FaTrashAlt className="h-3 w-3" /> Delete
            </button>
          </div>
        </form>
      )}

      {hasDeal && (
        <p className="mt-2 text-xs text-gray-500">This enquiry is closed. No further replies needed.</p>
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