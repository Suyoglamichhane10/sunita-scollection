import React, { useState } from 'react';

const ReplyModal = ({ isOpen, onClose, onConfirm, enquiry, loading }) => {
  const [adminReply, setAdminReply] = useState('');
  const [quotedPrice, setQuotedPrice] = useState('');
  const [action, setAction] = useState('reply');

  if (!isOpen || !enquiry) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({
      action,
      adminReply: adminReply.trim(),
      quotedPrice: quotedPrice ? Number(quotedPrice) : undefined,
    });
  };

  const getActionLabel = () => {
    switch (action) {
      case 'share-price': return 'Share Price';
      case 'suggest-price': return 'Suggest New Price';
      case 'call': return 'Contact to Fix Price';
      case 'update-final-price': return 'Update Final Price';
      default: return 'Send Reply';
    }
  };

  const showPriceInput = ['share-price', 'suggest-price', 'update-final-price'].includes(action);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-3xl border border-gray-200 bg-white p-6 shadow-xl">
        <div className="flex items-center gap-3 text-primary">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900">Reply to Enquiry</h3>
        </div>

        <div className="mt-4 rounded-xl bg-gray-50 p-4">
          <p className="text-sm font-medium text-gray-900">{enquiry.name}</p>
          <p className="text-xs text-gray-500">{enquiry.phone} {enquiry.email && `• ${enquiry.email}`}</p>
          <p className="mt-2 text-sm text-gray-700">
            <span className="font-semibold">Product:</span> {enquiry.productId?.name || 'Unknown'}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            <span className="font-semibold">Message:</span> {enquiry.message}
          </p>
          {enquiry.quotedPrice && (
            <p className="mt-1 text-sm font-semibold text-pink-600">
              Quoted Price: Rs. {enquiry.quotedPrice}
            </p>
          )}
          {enquiry.dealPrice && (
            <p className="mt-1 text-sm font-semibold text-purple-600">
              Deal Price: Rs. {enquiry.dealPrice}
            </p>
          )}
        </div>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Action Type</label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-ink outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
            >
              <option value="reply">Send Reply</option>
              <option value="share-price">Share Price</option>
              <option value="suggest-price">Suggest New Price</option>
              <option value="call">Contact to Fix Price</option>
              <option value="update-final-price">Update Final Price</option>
            </select>
          </div>

          {action !== 'call' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reply Message</label>
              <textarea
                value={adminReply}
                onChange={(e) => setAdminReply(e.target.value)}
                rows={3}
                required
                placeholder="Type your reply to the customer..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
              />
            </div>
          )}

          {showPriceInput && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (Rs.)</label>
              <input
                type="number"
                min="0"
                value={quotedPrice}
                onChange={(e) => setQuotedPrice(e.target.value)}
                placeholder="Enter price"
                required={showPriceInput}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-full border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (showPriceInput && !quotedPrice)}
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {loading ? 'Sending...' : getActionLabel()}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReplyModal;
