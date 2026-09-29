import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../Context/Authcontext';
import { useChat } from '../Context/ChatContext';
import api from '../Services/api';

const useNotifications = (active = false) => {
  const [counts, setCounts] = useState({
    total: 0,
    enquiries: 0,
    orders: 0,
    messages: 0,
    wishlist: 0,
    rewards: 0,
  });
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const { socketRef } = useChat();
  const pollRef = useRef(null);
  const lastClearedAtRef = useRef(localStorage.getItem('notificationLastClearedAt') || null);

  // ── Fetch unread counts from GET /api/notifications/unread-count ──
  const fetchCounts = useCallback(async () => {
    if (!active || !isAuthenticated) return;
    try {
      const { data } = await api.get('/notifications/unread-count');
      const lastClearedAt = lastClearedAtRef.current;
      if (lastClearedAt) {
        const clearedTime = new Date(lastClearedAt).getTime();
        if (clearedTime > 0) {
          setCounts((prev) => ({
            ...prev,
            total: 0,
            enquiries: 0,
            orders: 0,
            messages: 0,
            wishlist: 0,
            rewards: 0,
          }));
          return;
        }
      }
      setCounts({
        total: data.total ?? 0,
        enquiries: data.enquiries ?? 0,
        orders: data.orders ?? 0,
        messages: data.messages ?? 0,
        wishlist: data.wishlist ?? 0,
        rewards: data.rewards ?? 0,
      });
    } catch (error) {
      console.error('Fetch unread count failed:', error);
    }
  }, [active, isAuthenticated]);

  // ── Fetch notification list from GET /api/notifications ──
  const fetchNotifications = useCallback(async () => {
    if (!active || !isAuthenticated) return;
    try {
      setLoading(true);
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Fetch notifications failed:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [active, isAuthenticated]);

  // ── Combined refetch for explicit refresh (e.g. on bell open) ──
  const refetch = useCallback(async () => {
    await Promise.all([fetchCounts(), fetchNotifications()]);
  }, [fetchCounts, fetchNotifications]);

  // ── Mark all as read ──
  const markAllRead = useCallback(async () => {
    if (!active || !isAuthenticated) return;
    try {
      await api.put('/notifications/read-all');
      setCounts((c) => ({ total: 0, enquiries: 0, orders: 0, messages: 0, wishlist: 0, rewards: 0 }));
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error('Mark all read failed:', error);
    }
  }, [active, isAuthenticated]);

  // ── Mark one notification as read ──
  const markOneRead = useCallback(
    async (notification) => {
      if (!active || !isAuthenticated) return;
      try {
        await api.put(`/notifications/${notification._id}/read?type=${notification.type || 'system'}`);
      } catch (error) {
        if (notification.type === 'enquiry' && notification.enquiryId) {
          try {
            await api.put(`/enquiries/${notification.enquiryId}/read-customer`);
          } catch {
            // ignore
          }
        }
      }
      setNotifications((prev) => prev.map((n) => (n._id === notification._id ? { ...n, read: true } : n)));
      await fetchCounts();
    },
    [active, isAuthenticated, fetchCounts]
  );

  // ── Clear all notifications (delete permanently) ──
  const clearAll = useCallback(async () => {
    if (!active || !isAuthenticated) return;
    try {
      const now = new Date().toISOString();
      lastClearedAtRef.current = now;
      localStorage.setItem('notificationLastClearedAt', now);
      await api.delete('/notifications');
      setNotifications([]);
      setCounts((c) => ({ total: 0, enquiries: 0, orders: 0, messages: 0, wishlist: 0, rewards: 0 }));
      setTimeout(() => {
        refetch();
      }, 2000);
    } catch (error) {
      console.error('Clear all notifications failed:', error);
    }
  }, [active, isAuthenticated, refetch]);

  // ── Initial fetch + 15-second polling for counts ──
  useEffect(() => {
    if (!active || !isAuthenticated) return;

    refetch();

    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      const lastClearedAt = lastClearedAtRef.current || localStorage.getItem('notificationLastClearedAt');
      if (lastClearedAt) {
        const clearedTime = new Date(lastClearedAt).getTime();
        if (clearedTime > Date.now() - 86400000) {
          return;
        }
      }
      fetchCounts();
    }, 15000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [active, isAuthenticated, refetch, fetchCounts]);

  // ── Socket.IO real-time events ──
  useEffect(() => {
    if (!socketRef?.current) return;
    const socket = socketRef.current;

    const handleRealtime = () => {
      fetchCounts();
      fetchNotifications();
    };

    socket.on('enquiry:new', handleRealtime);
    socket.on('enquiry:reply', handleRealtime);
    socket.on('enquiry:counter', handleRealtime);
    socket.on('enquiry:deal_closed', handleRealtime);
    socket.on('order:updated', handleRealtime);
    socket.on('order:status', handleRealtime);
    socket.on('message:new', handleRealtime);

    return () => {
      socket.off('enquiry:new', handleRealtime);
      socket.off('enquiry:reply', handleRealtime);
      socket.off('enquiry:counter', handleRealtime);
      socket.off('enquiry:deal_closed', handleRealtime);
      socket.off('order:updated', handleRealtime);
      socket.off('order:status', handleRealtime);
      socket.off('message:new', handleRealtime);
    };
  }, [socketRef, isAuthenticated, fetchCounts, fetchNotifications]);

  // backward-compatible alias used by NotificationBell
  const unreadCount = counts.total;

  return {
    total: counts.total,
    enquiries: counts.enquiries,
    orders: counts.orders,
    messages: counts.messages,
    wishlist: counts.wishlist,
    rewards: counts.rewards,
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAllRead,
    markOneRead,
    clearAll,
    refetch,
  };
};

export default useNotifications;