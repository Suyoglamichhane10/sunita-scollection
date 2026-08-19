import { useState } from 'react';
import { FaWhatsapp, FaTiktok, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../../Services/api';

const WHATSAPP_ADMIN_NUMBER = '9779768562128';
const TIKTOK_PROFILE_URL = 'https://www.tiktok.com/@sunitalamichhane27?_r=1&_t=ZS-98yy5adPc8O';

const WhatsAppChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    senderName: '',
    senderContact: '',
    message: "Hi Sunita! I'm interested in your products. Can you please share more details?",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.senderName.trim() || !formData.senderContact.trim() || !formData.message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/messages/public', {
        source: 'whatsapp',
        senderName: formData.senderName.trim(),
        senderContact: formData.senderContact.trim(),
        message: formData.message.trim(),
      });

      const encodedMessage = encodeURIComponent(
        `📩 New Message from Sunita's Collection Website\n👤 Customer Name: ${formData.senderName.trim()}\n📱 Phone: ${formData.senderContact.trim()}\n📝 Message: ${formData.message.trim()}\n\nPlease reply to this customer directly on WhatsApp.`
      );

      window.open(`https://wa.me/${WHATSAPP_ADMIN_NUMBER}?text=${encodedMessage}`, '_blank');

      setFormData({
        senderName: '',
        senderContact: '',
        message: "Hi Sunita! I'm interested in your products. Can you please share more details?",
      });
      setIsOpen(false);
      toast.success('Message sent! Opening WhatsApp...');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Social Buttons - bottom right stack */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-3">
        {/* WhatsApp Button - on top */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="group flex items-center gap-2 rounded-full bg-green-500 pl-3 pr-4 py-2 text-white shadow-lg transition hover:bg-green-600 hover:scale-105 animate-pulse-slow"
          aria-label="Chat with us on WhatsApp"
        >
          {isOpen ? <FaTimes className="text-xl" /> : <FaWhatsapp className="text-2xl" />}
          <span className="text-sm font-semibold whitespace-nowrap animate-loop-text">Chat now</span>
        </button>

        {/* TikTok Button - below WhatsApp */}
        <a
          href={TIKTOK_PROFILE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2 rounded-full bg-black pl-3 pr-4 py-2 text-white shadow-lg transition hover:scale-105"
          aria-label="Check TikTok"
        >
          <FaTiktok className="text-xl" />
          <span className="text-sm font-semibold whitespace-nowrap animate-loop-text">Watch here</span>
        </a>
      </div>

      {/* WhatsApp Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between rounded-t-3xl bg-green-500 px-6 py-4 text-white">
              <div className="flex items-center gap-3">
                <FaWhatsapp className="text-2xl" />
                <div>
                  <p className="font-semibold">Chat with us</p>
                  <p className="text-xs text-white/80">We typically reply within minutes</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white"
              >
                <FaTimes />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-4">
                <label htmlFor="senderName" className="mb-1 block text-sm font-medium text-gray-700">
                  Your Name
                </label>
                <input
                  type="text"
                  id="senderName"
                  name="senderName"
                  value={formData.senderName}
                  onChange={handleInputChange}
                  placeholder="Enter your name"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-green-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label htmlFor="senderContact" className="mb-1 block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="senderContact"
                  name="senderContact"
                  value={formData.senderContact}
                  onChange={handleInputChange}
                  placeholder="Enter your phone number"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-green-500"
                  required
                />
              </div>

              <div className="mb-6">
                <label htmlFor="message" className="mb-1 block text-sm font-medium text-gray-700">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Type your message..."
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-green-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-green-500 px-6 py-3 font-semibold text-white transition hover:bg-green-600 disabled:opacity-50"
              >
                <FaWhatsapp />
                {isSubmitting ? 'Sending...' : 'Send Message via WhatsApp'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default WhatsAppChatWidget;
