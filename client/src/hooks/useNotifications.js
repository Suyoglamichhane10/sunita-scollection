import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../Context/Authcontext';
import { useChat } from '../Context/ChatContext';
import api from '../Services/api';

const CLEARED_KEY = 'notificationLastClearedAt';

const EMPTY_COUNTS = {
  total: 0,
  enquiries: 0,
  orders: 0,
  messages: 0,
  wishlist: 0,
  rewards: 0,
};

// A short, subtle two-note chime via Web Audio so no audio asset is needed.
const playNotificationChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    [880, 1174.66].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.1);
      gain.gain.setValueAtTime(0.0001, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.12, now + i * 0.1 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.1 + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.6);
    });
    setTimeout(() => ctx.close().catch(() => {}), 1200);
  } catch {
    // ignore audio errors
  }
};

const useNotifications = (active = false) => {
  const [counts, setCounts] = useState(EMPTY_COUNTS);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [clearedAt, setClearedAt] = useState(() => localStorage.getItem(CLEARED_KEY) || null);
  const [latestArrival, setLatestArrival] = useState(null);
  const { isAuthenticated } = useAuth();
  const { socketRef } = useChat();
  const pollRef = useRef(null);
  const clearedAtRef = useRef(clearedAt);

  // Remember which notifications have already been announced so the chime
  // only fires for genuinely new arrivals, never on the first load.
  const seenKeysRef = useRef(null);

  const readClearedAt = useCallback(() => localStorage.getItem(CLEARED_KEY) || null, []);

  const isNewerThanClear = useCallback((item) => {
    const cleared = clearedAtRef.current;
    if (!cleared) return true;
    return new Date(item?.createdAt || 0).getTime() > new Date(cleared).getTime();
  }, []);

  // ── Unread counts from the server (authoritative once nothing is cleared) ──
  const fetchCounts = useCallback(async () => {
    if (!active || !isAuthenticated) return;
    try {
      const { data } = await api.get('/notifications/unread-count');
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

  // ── Notification list, filtered by the clear timestamp ──
  const fetchNotifications = useCallback(async () => {
    if (!active || !isAuthenticated) return;
    try {
      setLoading(true);
      const { data } = await api.get('/notifications');
      const items = (data.notifications || []).filter(isNewerThanClear);
      setNotifications(items);
    } catch (error) {
      console.error('Fetch notifications failed:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [active, isAuthenticated, isNewerThanClear]);

  // ── Combined refetch for explicit refresh (e.g. on bell open) ──
  const refetch = useCallback(async () => {
    await Promise.all([fetchCounts(), fetchNotifications()]);
  }, [fetchCounts, fetchNotifications]);

  // ── Announce only genuinely new notifications ──
  useEffect(() => {
    const keys = notifications.map((n) => `${n._id || n.id || ''}|${n.message || ''}|${n.createdAt || ''}`);
    if (seenKeysRef.current === null) {
      // First load after mount: record what exists, but stay silent.
      seenKeysRef.current = new Set(keys);
      return;
    }
    const previous = seenKeysRef.current;
    seenKeysRef.current = new Set(keys);
    if (keys.some((key) => !previous.has(key))) {
      playNotificationChime();
      const newest = [...notifications].sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      )[0];
      if (newest) setLatestArrival(newest);
    }
  }, [notifications]);

  // Reset the "already seen" memory whenever the user clears or logs out,
  // so the next arrival is treated as new.
  useEffect(() => {
    if (!isAuthenticated) {
      seenKeysRef.current = null;
      setNotifications([]);
      setCounts(EMPTY_COUNTS);
    }
  }, [isAuthenticated]);

  // ── Mark all as read ──
  const markAllRead = useCallback(async () => {
    if (!active || !isAuthenticated) return;
    try {
      await api.put('/notifications/read-all');
      setCounts(EMPTY_COUNTS);
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
      } catch {
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

  // ── Clear all: hide everything that existed at this moment. The server
  // synthesises enquiry/order rows at read time, so deleting is not enough —
  // the timestamp is what actually keeps them out of the panel and the badge. ──
  const clearAll = useCallback(async () => {
    if (!active || !isAuthenticated) return;
    const now = new Date().toISOString();
    localStorage.setItem(CLEARED_KEY, now);
    clearedAtRef.current = now;
    setClearedAt(now);
    setNotifications([]);
    setCounts(EMPTY_COUNTS);
    seenKeysRef.current = new Set();
    try {
      await api.delete('/notifications');
    } catch (error) {
      console.error('Clear all notifications failed:', error);
    }
  }, [active, isAuthenticated]);

  // ── Initial fetch + 15-second polling ──
  useEffect(() => {
    if (!active || !isAuthenticated) return;

    clearedAtRef.current = readClearedAt();
    refetch();

    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      fetchCounts();
      fetchNotifications();
    }, 15000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [active, isAuthenticated, refetch, fetchCounts, fetchNotifications, readClearedAt]);

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
    socket.on('notification:new', handleRealtime);

    return () => {
      socket.off('enquiry:new', handleRealtime);
      socket.off('enquiry:reply', handleRealtime);
      socket.off('enquiry:counter', handleRealtime);
      socket.off('enquiry:deal_closed', handleRealtime);
      socket.off('order:updated', handleRealtime);
      socket.off('order:status', handleRealtime);
      socket.off('message:new', handleRealtime);
      socket.off('notification:new', handleRealtime);
    };
  }, [socketRef, isAuthenticated, fetchCounts, fetchNotifications]);

  // ── Badge source of truth ──
  // Before any clear the server count is authoritative. After a clear, only
  // unread rows newer than the clear timestamp may badge, so the count comes
  // from the filtered list instead.
  const visibleUnread = notifications.filter((n) => !n.read).length;
  const effectiveTotal = clearedAt ? visibleUnread : Math.max(counts.total, visibleUnread);

  return {
    total: clearedAt ? visibleUnread : counts.total,
    enquiries: counts.enquiries,
    orders: counts.orders,
    messages: counts.messages,
    wishlist: counts.wishlist,
    rewards: counts.rewards,
    notifications,
    unreadCount: effectiveTotal,
    clearedAt,
    latestArrival,
    loading,
    fetchNotifications,
    markAllRead,
    markOneRead,
    clearAll,
    refetch,
  };
};

export default useNotifications;
