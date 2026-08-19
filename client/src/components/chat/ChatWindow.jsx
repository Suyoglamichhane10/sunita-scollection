import React, { useEffect, useRef, useState } from 'react';
import { FaPaperPlane, FaPaperclip, FaSearch, FaTrash, FaCheckDouble, FaCheck } from 'react-icons/fa';
import api from '../../Services/api';
import { useAuth } from '../../Context/Authcontext';
import { useChat } from '../../Context/ChatContext';
import toast from 'react-hot-toast';

const ChatWindow = ({ conversationId, onBack }) => {
  const { user } = useAuth();
  const { joinConversation, leaveConversation, sendTyping, emitReadReceipt, typingUsers, socketRef } = useChat();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const bodyRef = useRef(null);
  const typingTimeout = useRef(null);

  useEffect(() => {
    if (!conversationId) return undefined;
    let active = true;

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/conversations/${conversationId}/messages`);
        if (!active) return;
        setMessages(data.messages || []);
      } catch (error) {
        toast.error('Unable to load messages');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchMessages();
    joinConversation(conversationId);

    const onNewMessage = ({ message }) => {
      if (!message || message.conversation !== conversationId && message.conversation?._id !== conversationId) return;
      setMessages((cur) => (cur.some((m) => m._id === message._id) ? cur : [...cur, message]));
      if (message.sender?._id !== user?._id && message.sender !== user?._id) {
        emitReadReceipt(conversationId, message._id);
      }
    };

    socketRef.current?.on('message:new', onNewMessage);

    return () => {
      active = false;
      socketRef.current?.off('message:new', onNewMessage);
      leaveConversation(conversationId);
    };
  }, [conversationId, joinConversation, leaveConversation, socketRef, user?._id, emitReadReceipt]);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages]);

  const handleTyping = (isTyping) => {
    sendTyping(conversationId, isTyping);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => sendTyping(conversationId, false), 1500);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text && !file) return;
    setInput('');
    try {
      const body = { text, messageType: file ? 'file' : 'text' };
      if (file) {
        body.attachment = {
          name: file.name,
          url: URL.createObjectURL(file),
          mimeType: file.type,
          size: file.size,
        };
      }
      const { data } = await api.post(`/conversations/${conversationId}/messages`, body);
      setMessages((cur) => [...cur, data.message]);
      setFile(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to send message');
    }
  };

  const handleSearch = async () => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const { data } = await api.get(`/conversations/${conversationId}/search?q=${encodeURIComponent(search)}`);
      setSearchResults(data.messages || []);
    } catch (error) {
      toast.error('Search failed');
    }
  };

  const isOwn = (m) => m.sender?._id === user?._id || m.sender === user?._id;

  return (
    <div className="flex h-[600px] flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-3">
        <div className="flex items-center gap-2">
          {onBack && (
            <button type="button" onClick={onBack} className="text-gray-500 hover:text-gray-700 md:hidden">
              ←
            </button>
          )}
          <div>
            <p className="font-semibold text-gray-900">Support Chat</p>
            <p className="text-xs text-gray-500">Our team</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search..."
              className="w-32 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-pink-500"
            />
            <button type="button" onClick={handleSearch} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
              <FaSearch className="text-xs" />
            </button>
          </div>
          {searchResults.length > 0 && (
            <button type="button" onClick={() => setSearchResults([])} className="text-xs text-gray-500 hover:text-gray-700">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Search results banner */}
      {searchResults.length > 0 && (
        <div className="border-b border-gray-100 bg-blue-50 px-4 py-2">
          <p className="mb-1 text-xs font-semibold text-blue-700">Search results ({searchResults.length})</p>
          <div className="max-h-20 space-y-1 overflow-y-auto">
            {searchResults.map((m) => (
              <button
                key={m._id}
                type="button"
                onClick={() => {
                  const el = document.getElementById(`msg-${m._id}`);
                  el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="block w-full truncate text-left text-xs text-blue-600 hover:underline"
              >
                {m.message}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div ref={bodyRef} className="flex-1 space-y-3 overflow-y-auto bg-gray-50 p-4">
        {loading ? (
          <div className="p-6 text-center text-sm text-gray-500">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-500">
            No messages yet. Start the conversation below!
          </div>
        ) : (
          messages.map((m) => {
            const own = isOwn(m);
            return (
              <div key={m._id} id={`msg-${m._id}`} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${own ? 'bg-pink-600 text-white' : 'bg-white text-gray-800 border border-gray-200'}`}>
                  {!own && <p className="mb-0.5 text-[10px] font-semibold text-pink-600">{m.senderName || 'Support'}</p>}
                  {m.isAutomated && (
                    <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Automated update</p>
                  )}
                  {m.messageType === 'file' && m.attachment ? (
                    <a href={m.attachment.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 font-medium underline">
                      📎 {m.attachment.name || 'File'}
                    </a>
                  ) : m.messageType === 'image' && m.attachment ? (
                    <img src={m.attachment.url} alt="attachment" className="max-h-48 rounded-xl" />
                  ) : (
                    <p>{m.message}</p>
                  )}
                  <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${own ? 'text-white/70' : 'text-gray-400'}`}>
                    <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {own &&
                      (m.readBy?.some((r) => r.user?.toString() !== user?._id?.toString()) ? (
                        <FaCheckDouble className="text-blue-300" />
                      ) : (
                        <FaCheck />
                      ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
        {typingUsers[conversationId] && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-white border border-gray-200 px-3 py-2 text-xs text-gray-500">
              {typingUsers[conversationId]} is typing<span className="typing-dots"><span>.</span><span>.</span><span>.</span></span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 bg-white p-3">
        {file && (
          <div className="mb-2 flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1.5 text-xs text-gray-700">
            <span>📎 {file.name}</span>
            <button type="button" onClick={() => setFile(null)} className="text-gray-400 hover:text-red-500">
              <FaTrash className="text-xs" />
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <label className="cursor-pointer rounded-full border border-gray-200 bg-gray-50 p-2 text-gray-500 hover:text-pink-600">
            <FaPaperclip />
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
          </label>
          <input
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              handleTyping(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            placeholder="Type your message..."
            className="min-w-0 flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none focus:border-pink-500"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() && !file}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-pink-600 text-white hover:bg-pink-700 disabled:opacity-50"
          >
            <FaPaperPlane className="text-sm" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
