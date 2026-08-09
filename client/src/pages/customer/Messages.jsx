import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../Services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../Context/Authcontext';
import { useChat } from '../../Context/ChatContext';
import ChatWindow from '../../components/chat/ChatWindow';
import { FaPlus, FaComments } from 'react-icons/fa';

const Messages = () => {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const { socketRef } = useChat();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newMsg, setNewMsg] = useState('');
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState('');

  const fetchConversations = async () => {
    try {
      const { data } = await api.get('/conversations');
      setConversations(data.conversations || []);
    } catch (error) {
      console.error(error);
      toast.error('Unable to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/orders/my-orders');
      setOrders(data.orders || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchConversations();
    fetchOrders();
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (!socketRef.current) return undefined;
    const onNewConversation = (conv) => {
      setConversations((cur) => (cur.some((c) => c._id === conv._id) ? cur : [conv, ...cur]));
    };
    const onMessageNew = ({ conversationId, message }) => {
      setConversations((cur) => cur.map((c) => {
        if (c._id === conversationId) {
          return { ...c, lastMessageAt: Date.now(), lastMessagePreview: message?.message || 'New message', unreadCount: (c.unreadCount || 0) + 1 };
        }
        return c;
      }));
    };
    socketRef.current.on('conversation:new', onNewConversation);
    socketRef.current.on('message:new', onMessageNew);
    return () => {
      socketRef.current?.off('conversation:new', onNewConversation);
      socketRef.current?.off('message:new', onMessageNew);
    };
  }, [socketRef]);

  const startConversation = async () => {
    if (!newMsg.trim()) return;
    try {
      const body = { message: newMsg };
      if (selectedOrder) body.orderId = selectedOrder;
      const { data } = await api.post('/conversations', body);
      setConversations((cur) => [data.conversation, ...cur]);
      setActiveId(data.conversation._id);
      setShowNew(false);
      setNewMsg('');
      setSelectedOrder('');
      toast.success('Conversation started');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to start conversation');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="container-custom px-4 lg:px-8">
          <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">Loading messages...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container-custom px-4 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
            <p className="mt-2 text-gray-600">Chat with our support team and discuss your orders in real time.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowNew((s) => !s)}
            className="flex items-center gap-2 rounded-full bg-pink-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pink-700"
          >
            <FaPlus /> New Chat
          </button>
        </div>

        {showNew && (
          <div className="mb-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Start a new conversation</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Related to an order? (optional)</label>
                <select
                  value={selectedOrder}
                  onChange={(e) => setSelectedOrder(e.target.value)}
                  className="w-full rounded-3xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-pink-500"
                >
                  <option value="">General support</option>
                  {orders.map((o) => (
                    <option key={o._id} value={o._id}>{o.orderNumber} - {o.orderStatus}</option>
                  ))}
                </select>
              </div>
              <textarea
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                placeholder="How can we help you?"
                className="h-24 w-full rounded-3xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-pink-500"
              />
              <button
                type="button"
                onClick={startConversation}
                disabled={!newMsg.trim()}
                className="rounded-full bg-pink-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-50"
              >
                Start Chat
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          {/* Conversation list */}
          <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 px-2 text-sm font-semibold uppercase tracking-wide text-gray-500">Conversations</h2>
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center rounded-2xl bg-gray-50 p-8 text-center">
                <FaComments className="mb-2 text-3xl text-gray-300" />
                <p className="text-sm text-gray-500">No conversations yet. Start a new chat!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((c) => (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => setActiveId(c._id)}
                    className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${activeId === c._id ? 'bg-pink-50 ring-1 ring-pink-200' : 'hover:bg-gray-50'}`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-100 text-pink-600">
                      <FaComments />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">{c.title || 'Support'}</p>
                      <p className="truncate text-xs text-gray-500">{c.order?.orderNumber || c.lastMessagePreview || 'No messages'}</p>
                      <p className="text-[10px] text-gray-400">{c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleString() : ''}</p>
                    </div>
                    {c.unreadCount > 0 && (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-pink-600 px-1.5 text-[11px] font-bold text-white">
                        {c.unreadCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Active chat */}
          <div>
            {activeId ? (
              <ChatWindow key={activeId} conversationId={activeId} />
            ) : (
              <div className="flex h-[600px] flex-col items-center justify-center rounded-3xl border border-gray-200 bg-white shadow-sm">
                <FaComments className="text-5xl text-gray-300" />
                <p className="mt-4 text-lg font-semibold text-gray-700">Select a conversation</p>
                <p className="mt-1 text-sm text-gray-500">or start a new chat to talk to us.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
