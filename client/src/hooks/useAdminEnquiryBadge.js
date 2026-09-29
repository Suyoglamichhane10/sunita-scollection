import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../Services/api';
import { useAuth } from '../Context/Authcontext';
import { useChat } from '../Context/ChatContext';

const useAdminEnquiryBadge = () => {
  const [counts, setCounts] = useState({ total: 0, pending: 0, unread: 0 });
  const { isAuthenticated, isAdmin } = useAuth();
  const { socketRef } = useChat();
  const countsRef = useRef(counts);
  countsRef.current = counts;

  const fetchCounts = useCallback(async () => {
    if (!isAuthenticated || !isAdmin) return;
    try {
      const unreadRes = await api.get('/enquiries/admin-unread-count');
      const allRes = await api.get('/enquiries', { params: { status: 'all', limit: 1000 } });
      const unread = unreadRes.data?.unreadCount || 0;
      const enquiries = allRes.data?.enquiries || [];
      const pending = enquiries.filter((e) => e.status === 'pending').length;
      const next = { total: enquiries.length, pending, unread };
      setCounts(next);
      if (unread > 0) {
        document.title = `Enquiries (${unread}) | Sunita'z Collection Admin`;
      } else {
        document.title = 'Admin Panel | Sunita\'z Collection';
      }
    } catch {
      setCounts({ total: 0, pending: 0, unread: 0 });
    }
  }, [isAuthenticated, isAdmin]);

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 15000);
    return () => clearInterval(interval);
  }, [fetchCounts]);

  useEffect(() => {
    if (!socketRef?.current) return;
    const socket = socketRef.current;
    const handler = () => {
      fetchCounts();
    };
    socket.on('enquiry:new', handler);
    socket.on('enquiry:reply', handler);
    socket.on('enquiry:counter', handler);
    socket.on('enquiry:deal_closed', handler);
    return () => {
      socket.off('enquiry:new', handler);
      socket.off('enquiry:reply', handler);
      socket.off('enquiry:counter', handler);
      socket.off('enquiry:deal_closed', handler);
    };
  }, [socketRef, fetchCounts]);

  return { counts, refresh: fetchCounts };
};

export default useAdminEnquiryBadge;