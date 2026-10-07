import React, { useState, useEffect } from 'react';
import api from '../../Services/api';
import { useAuth } from '../../Context/Authcontext';
import { useEnquiry } from '../../Context/EnquiryContext';
import toast from 'react-hot-toast';
import { FaTimes } from 'react-icons/fa';
import {
  PHONE_ERROR_CLASS,
  PHONE_ERROR_MESSAGE,
  PHONE_INPUT_PROPS,
  isValidNepaliPhone,
  sanitizePhone,
} from '../../utils/validatePhone';

const EnquiryModal = ({ product: propProduct, isOpen: propIsOpen, onClose: propOnClose }) => {
  const { user, isAuthenticated } = useAuth();
  const enquiryContext = useEnquiry();
  const contextOpen = enquiryContext?.isOpen ?? false;
  const contextProduct = enquiryContext?.product ?? null;

  const isOpen = propIsOpen ?? contextOpen;
  const product = propProduct ?? contextProduct;
  const close = propOnClose ?? enquiryContext?.closeEnquiry ?? (() => {});
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [phoneError, setPhoneError] = useState(false);

  useEffect(() => {
    if (isOpen && product && isAuthenticated) {
      setForm({
        name: user?.name || '',
        phone: user?.phone || '',
        email: user?.email || '',
        message: `I'm interested in "${product.name}". Could you please share the price and availability?`,
      });
      setSuccess(false);
      setPhoneTouched(false);
      setPhoneError(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, product, isAuthenticated, user]);

  const handleChange = (e) => {
    if (e.target.name === 'phone') {
      const digits = sanitizePhone(e.target.value);
      setForm((prev) => ({ ...prev, phone: digits }));
      if (phoneTouched) setPhoneError(!isValidNepaliPhone(digits));
      return;
    }
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePhoneBlur = () => {
    setPhoneTouched(true);
    setPhoneError(!isValidNepaliPhone(form.phone));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setPhoneTouched(true);
    if (!isValidNepaliPhone(form.phone)) {
      setPhoneError(true);
      return;
    }

    setLoading(true);
    try {
      await api.post('/enquiries', {
        productId: product._id,
        name: form.name,
        phone: form.phone,
        email: form.email || null,
        message: form.message,
      });
      setSuccess(true);
      setForm({ name: '', phone: '', email: '', message: '' });
      setPhoneTouched(false);
      setPhoneError(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit enquiry');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
      onClick={close}
    >
      <div
        className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={close}
          className="absolute right-4 top-4 rounded-full bg-gray-100 p-2 text-gray-500 transition hover:bg-gray-200"
        >
          <FaTimes className="h-5 w-5" />
        </button>

        <h2 className="mb-1 font-serif text-2xl font-bold text-gray-900">
          Enquire About {product.name}
        </h2>
        <p className="mb-6 text-sm text-gray-500">
          Fill in your details and we'll get back to you shortly with a price.
        </p>

        {success ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="mb-2 font-serif text-xl font-bold text-gray-900">
              Enquiry Submitted Successfully!
            </h3>
            <p className="text-sm text-gray-500">
              Our team has received your enquiry. We'll reply with a price soon.
            </p>
            <button
              type="button"
              onClick={close}
              className="mt-6 rounded-full bg-pink-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-pink-700"
            >
              Close
            </button>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Phone Number *
              </label>
              <input
                {...PHONE_INPUT_PROPS}
                name="phone"
                value={form.phone}
                onChange={handleChange}
                onBlur={handlePhoneBlur}
                required
                aria-invalid={phoneError}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                placeholder="98XXXXXXXXX"
              />
              {phoneError && (
                <p className={PHONE_ERROR_CLASS}>{PHONE_ERROR_MESSAGE}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Email (Optional)
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Message *
              </label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                required
                rows={4}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                placeholder="Tell us what you're looking for..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-pink-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="-ml-1 h-5 w-5 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Submitting...
                </span>
              ) : (
                'Submit Enquiry'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default EnquiryModal;
