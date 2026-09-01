import { useEffect, useRef, useState } from 'react';
import { FaWhatsapp, FaTiktok, FaTimes, FaPaperPlane } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../../Services/api';

const WHATSAPP_ADMIN_NUMBER = '9779768562128';
const TIKTOK_PROFILE_URL = 'https://www.tiktok.com/@sunitalamichhane27?_r=1&_t=ZS-98yy5adPc8O';

const WELCOME_MESSAGE = "Namaste! 👋 Welcome to Sunita'z Collection. How can we help you today? You can ask about products, orders, delivery, returns, or anything else.";

const QUICK_OPTIONS = [
  { label: '📦 Track order', text: 'I want to track my order status' },
  { label: '🔁 Return / Exchange', text: 'I need help with return or exchange' },
  { label: '🚚 Delivery info', text: 'Tell me about delivery options and timing' },
  { label: '💳 Payment issue', text: 'I have a payment related question' },
  { label: '👗 Product help', text: 'I have a question about a product' },
  { label: '📞 Other', text: 'I want to speak with support' },
];

const WhatsAppChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bodyRef = useRef(null);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'bot',
          text: WELCOME_MESSAGE,
        },
      ]);
    }
  }, [isOpen]);

  const sendMessage = async (text) => {
    if (!text.trim() || sending) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      text: text.trim(),
    };
    setMessages((cur) => [...cur, userMessage]);
    setInput('');
    setSending(true);

    try {
      await api.post('/messages/public', {
        source: 'website',
        senderName: 'Customer',
        senderContact: '',
        message: text.trim(),
      });

      const encodedMessage = encodeURIComponent(
        `📩 New Chat Message from Sunita'z Collection Website\n👤 Customer: Customer\n📝 Message: ${text.trim()}\n\nPlease reply to this customer directly on WhatsApp.`
      );

      window.open(`https://wa.me/${WHATSAPP_ADMIN_NUMBER}?text=${encodedMessage}`, '_blank');

      setMessages((cur) => [
        ...cur,
        {
          id: Date.now() + 1,
          role: 'bot',
          text: 'Thanks for your message! We have received your query and our team will get back to you shortly on WhatsApp.',
        },
      ]);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to send message. Please try again.');
      setMessages((cur) => [
        ...cur,
        {
          id: Date.now() + 1,
          role: 'bot',
          text: 'Sorry, something went wrong. Please try again or contact us directly on WhatsApp.',
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleSend = async () => {
    await sendMessage(input);
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

      {/* WhatsApp Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 flex w-[360px] max-w-[calc(100vw-3rem)] max-h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between bg-green-500 px-4 py-3 text-white">
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

          {/* Messages */}
          <div ref={bodyRef} className="flex-1 space-y-3 overflow-y-auto bg-gray-50 p-4" style={{ minHeight: 360, maxHeight: 420 }}>
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.role === 'user' ? 'bg-green-600 text-white' : 'bg-white text-gray-800 border border-gray-200'}`}>
                  {m.role === 'bot' && (
                    <p className="mb-0.5 text-[10px] font-semibold text-green-700">Sunita&apos;s Assistant</p>
                  )}
                  {m.role === 'user' && (
                    <p className="mb-0.5 text-[10px] font-semibold text-white/80">You</p>
                  )}
                  <p>{m.text}</p>
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-white border border-gray-200 px-4 py-2 text-sm text-gray-500">
                  <span className="typing-dots"><span>.</span><span>.</span><span>.</span></span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 bg-white p-3">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSend();
                }}
                placeholder="Type your message..."
                className="min-w-0 flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none focus:border-green-500"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={sending || !input.trim()}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-green-600 text-white transition hover:bg-green-700 disabled:opacity-50"
              >
                <FaPaperPlane className="text-sm" />
              </button>
            </div>

            {/* Quick options */}
            <div className="mt-3 flex flex-wrap gap-2">
              {QUICK_OPTIONS.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => sendMessage(option.text)}
                  disabled={sending}
                  className="rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 transition hover:bg-green-100 disabled:opacity-50"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WhatsAppChatWidget;
