import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../Services/api';
import { useAuth } from '../Context/Authcontext';
import { useChat } from '../Context/ChatContext';

const useAdminOrderBadge = () => {
  const [counts, setCounts] = useState({ total: 0, new: 0 });
  const { isAuthenticated, isAdmin } = useAuth();
  const { socketRef } = useChat();
  const countsRef = useRef(counts);
  countsRef.current = counts;

  const fetchCounts = useCallback(async () => {
    if (!isAuthenticated || !isAdmin) return;
    try {
      const res = await api.get('/orders/metrics');
      const metrics = res.data?.metrics || {};
      const next = { total: metrics.totalOrders || 0, new: metrics.pendingOrders || 0 };
      setCounts(next);
    } catch {
      setCounts({ total: 0, new: 0 });
    }
  }, [isAuthenticated, isAdmin]);

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [fetchCounts]);

  useEffect(() => {
    if (!socketRef?.current) return;
    const socket = socketRef.current;
    const handler = () => {
      fetchCounts();
    };
    // Listen for new order notifications and order updates
    socket.on('notification:new', (data) => {
      if (data?.type === 'order') {
        handler();
      }
    });
    socket.on('order:updated', handler);
    return () => {
      socket.off('notification:new', handler);
      socket.off('order:updated', handler);
    };
  }, [socketRef, fetchCounts]);

  return { counts, refresh: fetchCounts };
};

export default useAdminOrderBadge;