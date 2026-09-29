import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useChat } from '../Context/ChatContext';
import api from '../Services/api';
import { useAuth } from '../Context/Authcontext';
import toast from 'react-hot-toast';

const useEnquiryNotifications = (active = false) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestReplies, setLatestReplies] = useState([]);
  const { isAuthenticated: _isAuthenticated } = useAuth();
  const prevUnreadRef = useRef(0);
  const { socketRef } = useChat();

  const fetchUnread = useCallback(async () => {
    if (!active) return;
    try {
      const { data } = await api.get('/enquiries/unread-count');
      setUnreadCount(data.unreadCount || 0);
    } catch {
      setUnreadCount(0);
    }
  }, [active]);

  const fetchLatestReplies = useCallback(async () => {
    if (!active) return;
    try {
      const { data } = await api.get('/enquiries/my');
      const replies = (data.enquiries || [])
        .filter((e) => ['pending', 'price_shared', 'negotiating', 'customer_agreed', 'deal_closed'].includes(e.status))
        .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
        .slice(0, 10);
      setLatestReplies(replies);
    } catch {
      setLatestReplies([]);
    }
  }, [active]);

  useEffect(() => {
    if (!active) return;
    fetchUnread();
    fetchLatestReplies();
    const interval = setInterval(() => {
      fetchUnread();
      fetchLatestReplies();
    }, 60000);
    return () => clearInterval(interval);
  }, [active, fetchUnread, fetchLatestReplies]);

  useEffect(() => {
    if (!socketRef?.current) return;
    const socket = socketRef.current;
    const refresh = () => {
      fetchUnread();
      fetchLatestReplies();
    };
    const onEnquiryReply = refresh;
    const onEnquiryNew = refresh;
    const onEnquiryCounter = refresh;
    const onEnquiryDealClosed = refresh;
    socket.on('enquiry:reply', onEnquiryReply);
    socket.on('enquiry:new', onEnquiryNew);
    socket.on('enquiry:counter', onEnquiryCounter);
    socket.on('enquiry:deal_closed', onEnquiryDealClosed);
    return () => {
      socket.off('enquiry:reply', onEnquiryReply);
      socket.off('enquiry:new', onEnquiryNew);
      socket.off('enquiry:counter', onEnquiryCounter);
      socket.off('enquiry:deal_closed', onEnquiryDealClosed);
    };
  }, [socketRef, active, fetchUnread, fetchLatestReplies]);

  useEffect(() => {
    if (active && unreadCount > prevUnreadRef.current) {
      const notification = React.createElement(
        'span',
        { className: 'flex items-center gap-2 rounded-lg bg-pink-50 px-4 py-3 text-sm font-medium text-pink-800' },
        React.createElement('span', { className: 'text-lg' }, '🔔'),
        'You have a new reply on your enquiry!'
      );
      toast.custom(notification, { duration: 5000 });
    }
    prevUnreadRef.current = unreadCount;
  }, [unreadCount, active]);

  const markAllRead = useCallback(async () => {
    if (!active) return;
    try {
      await api.put('/enquiries/read-all');
      setUnreadCount(0);
      prevUnreadRef.current = 0;
    } catch {
      // ignore
    }
  }, [active]);

  return { unreadCount, latestReplies, markAllRead, refreshUnread: fetchUnread, refreshReplies: fetchLatestReplies };
};

export default useEnquiryNotifications;