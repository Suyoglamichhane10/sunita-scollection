import React, { useEffect, useState } from 'react';
import api from '../../Services/api';
import toast from 'react-hot-toast';
import { createSocket } from '../../Services/socket';

const AdminMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replies, setReplies] = useState({});

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
    return () => socket.disconnect();
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

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container-custom px-4 lg:px-8">
        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">Customer Messages</h1>
          <p className="mt-2 text-gray-600">View and reply to customer inquiries.</p>

          <div className="mt-10 space-y-4">
            {loading ? (
              <div className="rounded-3xl border border-gray-200 bg-gray-50 p-10 text-center">Loading messages...</div>
            ) : messages.length ? (
              messages.map((message) => (
                <div key={message._id} className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-500">
                    <span>Source: {message.source}</span>
                    <span>{new Date(message.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-gray-700">From: {message.senderName}</p>
                    <p className="mt-2 text-gray-900">{message.message}</p>
                  </div>
                  {message.reply && (
                    <div className="mt-4 rounded-3xl bg-white p-4 text-sm text-gray-700">
                      <p className="font-semibold text-gray-900">Reply:</p>
                      <p className="mt-2">{message.reply}</p>
                    </div>
                  )}
                  <div className="mt-4 flex gap-2">
                    <input
                      value={replies[message._id] || ''}
                      onChange={(event) => setReplies((current) => ({ ...current, [message._id]: event.target.value }))}
                      placeholder="Write a reply"
                      className="min-w-0 flex-1 border border-gray-300 px-3 py-2 text-sm outline-none focus:border-pink-600"
                    />
                    <button type="button" onClick={() => reply(message._id)} className="bg-pink-600 px-4 py-2 text-sm font-semibold text-white">Reply</button>
                  </div>
                </div>
              ))
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
