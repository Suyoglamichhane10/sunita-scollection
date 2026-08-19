import React, { useEffect, useState } from 'react';
import api from '../../Services/api';
import toast from 'react-hot-toast';
import { FaTrash, FaReply } from 'react-icons/fa';
import { createSocket, releaseSocket } from '../../Services/socket';

const AdminMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replies, setReplies] = useState({});
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data } = await api.get('/messages');
        setMessages(data.messages);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  useEffect(() => {
    const socket = createSocket();
    socket.emit('join-admin-inbox');
    socket.on('message:created', (message) => setMessages((current) => current.some((item) => item._id === message._id) ? current : [message, ...current]));
    socket.on('message:replied', (message) => setMessages((current) => current.map((item) => item._id === message._id ? message : item)));
    return () => {
      releaseSocket();
      socket.off('message:created');
      socket.off('message:replied');
    };
  }, []);

  const reply = async (messageId) => {
    const replyText = replies[messageId]?.trim();
    if (!replyText) return;
    try {
      const { data } = await api.put(`/messages/${messageId}/reply`, { reply: replyText });
      setMessages((current) => current.map((message) => message._id === messageId ? data.message : message));
      setReplies((current) => ({ ...current, [messageId]: '' }));
      toast.success('Reply sent');
    } catch (error) { toast.error(error.response?.data?.message || 'Unable to send reply'); }
  };

  const handleDelete = async (message) => {
    if (!window.confirm('Delete this message? This cannot be undone.')) return;
    try {
      await api.delete(`/messages/${message._id}`);
      setMessages((current) => current.filter((item) => item._id !== message._id));
      toast.success('Message deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to delete message');
    }
  };

  const filteredMessages = filter === 'all' ? messages : messages.filter((m) => m.source === filter);

  const getStatusBadge = (status) => {
    const colors = {
      new: 'bg-yellow-100 text-yellow-800',
      replied: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getSourceBadge = (source) => {
    const colors = {
      website: 'bg-blue-100 text-blue-800',
      whatsapp: 'bg-green-100 text-green-800',
      tiktok: 'bg-black text-white',
      facebook: 'bg-indigo-100 text-indigo-800',
      chat: 'bg-pink-100 text-pink-800',
    };
    return colors[source] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container-custom px-4 lg:px-8">
        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Customer Messages</h1>
              <p className="mt-2 text-gray-600">View and reply to customer inquiries from all channels.</p>
            </div>
            <div className="flex gap-2">
              {['all', 'website', 'whatsapp', 'tiktok', 'facebook', 'chat'].map((source) => (
                <button
                  key={source}
                  onClick={() => setFilter(source)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${
                    filter === source ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {source}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-10 overflow-x-auto">
            {loading ? (
              <div className="rounded-3xl border border-gray-200 bg-gray-50 p-10 text-center">Loading messages...</div>
            ) : filteredMessages.length ? (
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-sm text-gray-500">
                    <th className="pb-3 font-medium">Customer</th>
                    <th className="pb-3 font-medium">Phone</th>
                    <th className="pb-3 font-medium">Source</th>
                    <th className="pb-3 font-medium">Message</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredMessages.map((message) => (
                    <tr key={message._id} className="hover:bg-gray-50">
                      <td className="py-4">
                        <p className="font-semibold text-gray-900">{message.senderName}</p>
                      </td>
                      <td className="py-4 text-sm text-gray-700">
                        {message.senderContact || '-'}
                      </td>
                      <td className="py-4">
                        <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${getSourceBadge(message.source)}`}>
                          {message.source}
                        </span>
                      </td>
                      <td className="py-4 text-sm text-gray-700">
                        <p className="max-w-xs truncate">{message.message}</p>
                        {message.reply && (
                          <p className="mt-1 text-xs text-green-600">Replied: {message.reply}</p>
                        )}
                      </td>
                      <td className="py-4">
                        <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusBadge(message.status)}`}>
                          {message.status}
                        </span>
                      </td>
                      <td className="py-4 text-sm text-gray-500">
                        {new Date(message.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => document.getElementById(`reply-input-${message._id}`)?.focus()}
                            className="flex items-center gap-1 rounded-full bg-pink-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-pink-700"
                          >
                            <FaReply /> Reply
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(message)}
                            className="flex items-center gap-1 rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                          >
                            <FaTrash /> Delete
                          </button>
                        </div>
                        <div className="mt-2 flex gap-2">
                          <input
                            id={`reply-input-${message._id}`}
                            value={replies[message._id] || ''}
                            onChange={(event) => setReplies((current) => ({ ...current, [message._id]: event.target.value }))}
                            placeholder="Write a reply..."
                            className="min-w-0 flex-1 rounded-full border border-gray-300 px-3 py-1.5 text-xs outline-none focus:border-pink-600"
                          />
                          <button
                            type="button"
                            onClick={() => reply(message._id)}
                            className="rounded-full bg-pink-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-pink-700"
                          >
                            Send
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="rounded-3xl border border-gray-200 bg-gray-50 p-10 text-center">No messages yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMessages;