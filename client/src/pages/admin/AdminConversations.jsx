import React, { useEffect, useState } from 'react';
import api from '../../Services/api';
import { useAuth } from '../../Context/Authcontext';
import { useChat } from '../../Context/ChatContext';
import toast from 'react-hot-toast';
import ChatWindow from '../../components/chat/ChatWindow';
import { FaComments, FaExclamationTriangle, FaTrash } from 'react-icons/fa';

const AdminConversations = () => {
  const { isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const { socketRef } = useChat();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    try {
      const { data } = await api.get('/conversations');
      setConversations(data.conversations || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/conversations/inbox/stats');
      setStats(data.stats);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !isAdmin) return;
    fetchConversations();
    fetchStats();
  }, [authLoading, isAuthenticated, isAdmin]);

  useEffect(() => {
    if (!socketRef.current) return undefined;
    const onNewConv = (conv) => setConversations((cur) => (cur.some((c) => c._id === conv._id) ? cur : [conv, ...cur]));
    const onMessage = ({ conversationId, message }) => {
      setConversations((cur) => cur.map((c) => {
        if (c._id === conversationId) {
          return { ...c, lastMessageAt: Date.now(), lastMessagePreview: message?.message || 'New message' };
        }
        return c;
      }));
    };
    socketRef.current.on('conversation:new', onNewConv);
    socketRef.current.on('message:new', onMessage);
    return () => {
      socketRef.current?.off('conversation:new', onNewConv);
      socketRef.current?.off('message:new', onMessage);
    };
  }, [socketRef]);

  const updateConversation = async (id, updates) => {
    try {
      const { data } = await api.put(`/conversations/${id}`, updates);
      setConversations((cur) => cur.map((c) => (c._id === id ? data.conversation : c)));
      toast.success('Conversation updated');
    } catch (error) {
      toast.error('Unable to update conversation');
    }
  };

  const handleDelete = async (conversation) => {
    if (!window.confirm(`Delete conversation${conversation.order?.orderNumber ? ` for order ${conversation.order.orderNumber}` : ''}? All its messages will also be removed.`)) return;
    try {
      await api.delete(`/conversations/${conversation._id}`);
      setConversations((cur) => cur.filter((c) => c._id !== conversation._id));
      if (activeId === conversation._id) setActiveId(null);
      toast.success('Conversation deleted');
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to delete conversation');
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-100 p-10 text-center text-gray-600">Loading inbox...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Unified Inbox</h1>
          <p className="mt-1 text-sm text-gray-600">Manage all customer conversations in one place.</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4"><p className="text-xs uppercase text-gray-500">Total</p><p className="text-2xl font-bold">{stats.total}</p></div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4"><p className="text-xs uppercase text-gray-500">Open</p><p className="text-2xl font-bold text-amber-600">{stats.open}</p></div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4"><p className="text-xs uppercase text-gray-500">Urgent</p><p className="flex items-center gap-1 text-2xl font-bold text-red-600"><FaExclamationTriangle /> {stats.urgent}</p></div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4"><p className="text-xs uppercase text-gray-500">Resolved</p><p className="text-2xl font-bold text-green-600">{stats.resolved}</p></div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        {/* Conversation list */}
        <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 px-2 text-sm font-semibold uppercase text-gray-500">Conversations</h2>
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl bg-gray-50 p-8 text-center">
              <FaComments className="mb-2 text-3xl text-gray-300" />
              <p className="text-sm text-gray-500">No conversations yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((c) => (
                <div key={c._id} className={`rounded-2xl p-3 transition ${activeId === c._id ? 'bg-pink-50 ring-1 ring-pink-200' : 'hover:bg-gray-50'}`}>
                  <button type="button" onClick={() => setActiveId(c._id)} className="flex w-full items-center gap-3 text-left">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-100 text-pink-600">
                      <FaComments />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">{c.customer?.name || c.title || 'Customer'}</p>
                      <p className="truncate text-xs text-gray-500">{c.order?.orderNumber || c.lastMessagePreview}</p>
                      <p className="text-[10px] text-gray-400">{c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleString() : ''}</p>
                    </div>
                    {c.priority === 'urgent' && <FaExclamationTriangle className="shrink-0 text-red-500" />}
                  </button>
                  <div className="mt-2 flex gap-1.5">
                    <button type="button" onClick={() => updateConversation(c._id, { status: c.status === 'open' ? 'resolved' : 'open' })} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-200">
                      {c.status === 'open' ? 'Resolve' : 'Reopen'}
                    </button>
                    <button type="button" onClick={() => updateConversation(c._id, { priority: c.priority === 'urgent' ? 'normal' : 'urgent' })} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-200">
                      {c.priority === 'urgent' ? 'Normal priority' : 'Mark urgent'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(c)}
                      className="flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-200"
                    >
                      <FaTrash className="text-[10px]" /> Delete
                    </button>
                  </div>
                </div>
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
              <p className="mt-1 text-sm text-gray-500">to view messages and reply.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminConversations;
