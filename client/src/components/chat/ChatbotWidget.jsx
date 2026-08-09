import React, { useEffect, useRef, useState } from 'react';
import { FaRobot, FaTimes, FaPaperPlane, FaHeadset, FaUser } from 'react-icons/fa';
import { useAuth } from '../../Context/Authcontext';
import api from '../../Services/api';
import toast from 'react-hot-toast';

const QUICK_REPLIES = [
  { label: 'Order status', text: 'Where is my order?' },
  { label: 'Recommend', text: 'Recommend me something' },
  { label: 'Return policy', text: "What's your return policy?" },
  { label: 'Store hours', text: 'What are your store hours?' },
];

const ChatbotWidget = () => {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('auto');
  const [escalated, setEscalated] = useState(false);
  const bodyRef = useRef(null);

  // The chatbot is strictly for authenticated customers. Do not render the
  // floating button or widget until the user has logged in.
  if (authLoading || !isAuthenticated) {
    return null;
  }

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, open]);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'bot',
          text: isAuthenticated
            ? `Namaste ${user?.name?.split(' ')[0] || 'there'}! 👋 Welcome to Sunita's Collection. How can I help you today? You can ask about your orders, products, returns, and more.`
            : "Namaste! 👋 Welcome to Sunita's Collection. Ask me about our products, delivery, returns, or anything else!",
        },
      ]);
    }
  }, [open, isAuthenticated, user, messages.length]);

  const sendMessage = async (overrideText) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;
    if (!isAuthenticated) {
      toast.error('Please login to chat with us');
      return;
    }

    setMessages((cur) => [...cur, { id: Date.now(), role: 'user', text }]);
    setInput('');
    setLoading(true);

    try {
const { data } = await api.post('/chatbot/message', {
        message: text,
        language,
      });
      // The backend returns `reply` as a plain string (the bot's message text).
      const botReply = data.reply;
      setMessages((cur) => [
        ...cur,
        { id: Date.now() + 1, role: 'bot', text: botReply },
      ]);
      if (data.escalate || data.escalated) {
        setEscalated(true);
      }
      if (data.recommendations?.length) {
        setMessages((cur) => [
          ...cur,
          {
            id: Date.now() + 2,
            role: 'bot',
            recommendations: data.recommendations,
          },
        ]);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to get a response');
      setMessages((cur) => [
        ...cur,
        { id: Date.now() + 1, role: 'bot', text: 'Sorry, I had trouble connecting. Please try again or contact our team.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleEscalate = async () => {
    try {
      await api.post('/chatbot/escalate', { message: 'Customer requested human agent' });
      setEscalated(true);
      setMessages((cur) => [
        ...cur,
        { id: Date.now(), role: 'bot', text: 'A human agent has been notified. They will reach out shortly. You can also send us a message in the Messages section.' },
      ]);
    } catch (error) {
      toast.error('Unable to escalate. Please use the Messages page.');
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-pink-600 text-white shadow-lg transition hover:bg-pink-700"
        aria-label="Open chatbot"
      >
        {open ? <FaTimes className="text-xl" /> : <FaRobot className="text-xl" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex w-[360px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-pink-600 to-rose-700 px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <FaRobot />
              </div>
              <div>
                <p className="font-semibold">Sunita&apos;s Assistant</p>
                <p className="text-xs text-white/80">24/7 AI support • Nepali + English</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="rounded-full bg-white/20 px-2 py-1 text-xs outline-none"
              >
                <option value="auto" className="text-gray-900">Auto</option>
                <option value="en" className="text-gray-900">English</option>
                <option value="ne" className="text-gray-900">नेपाली</option>
              </select>
              <button type="button" onClick={() => setOpen(false)} className="text-white/80 hover:text-white">
                <FaTimes />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={bodyRef} className="flex-1 space-y-3 overflow-y-auto bg-gray-50 p-4" style={{ minHeight: 360, maxHeight: 420 }}>
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.role === 'user' ? 'bg-pink-600 text-white' : 'bg-white text-gray-800 border border-gray-200'}`}>
                  {m.role === 'bot' && (
                    <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-pink-600">
                      <FaRobot /> Assistant
                    </div>
                  )}
                  {m.role === 'user' && (
                    <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-white/80">
                      <FaUser /> You
                    </div>
                  )}
                  {m.text && <p>{m.text}</p>}
                  {m.recommendations?.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {m.recommendations.map((p) => (
                        <a
                          key={p._id}
                          href={`/product/${p._id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-2 hover:border-pink-300"
                        >
                          {p.images?.[0]?.url && (
                            <img src={p.images[0].url} alt={p.name} className="h-10 w-10 rounded-lg object-cover" />
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-gray-900">{p.name}</p>
                            <p className="text-xs font-bold text-pink-600">Rs. {p.price}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-white border border-gray-200 px-4 py-2 text-sm text-gray-500">
                  <span className="typing-dots"><span>.</span><span>.</span><span>.</span></span>
                </div>
              </div>
            )}
          </div>

          {/* Quick replies */}
          {!escalated && messages.length <= 2 && (
            <div className="flex flex-wrap gap-2 border-t border-gray-100 bg-white px-3 pb-2 pt-2">
              {QUICK_REPLIES.map((q) => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => sendMessage(q.text)}
                  className="rounded-full border border-pink-200 bg-pink-50 px-3 py-1 text-xs font-medium text-pink-700 hover:bg-pink-100"
                >
                  {q.label}
                </button>
              ))}
            </div>
          )}

          {/* Escalate button */}
          {!escalated && (
            <button
              type="button"
              onClick={handleEscalate}
              className="mx-3 mb-2 flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
            >
              <FaHeadset /> Talk to a human agent
            </button>
          )}

          {/* Input */}
          <div className="flex items-center gap-2 border-t border-gray-100 bg-white p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') sendMessage();
              }}
              placeholder="Type your message..."
              className="min-w-0 flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none focus:border-pink-500"
            />
            <button
              type="button"
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-pink-600 text-white transition hover:bg-pink-700 disabled:opacity-50"
            >
              <FaPaperPlane className="text-sm" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;
