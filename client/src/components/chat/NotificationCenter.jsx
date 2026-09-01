import React, { useEffect, useRef, useState } from 'react';
import { FaBell, FaTimes } from 'react-icons/fa';
import { useChat } from '../../Context/ChatContext';
import api from '../../Services/api';

const playBellSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    const frequencies = [523.25, 659.25, 783.99, 1046.5];
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      gain.gain.setValueAtTime(0.0001, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.15, now + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.7);
    });
  } catch {
    // ignore audio errors
  }
};

const NotificationCenter = () => {
  const { notifications, unreadCount, clearNotifications } = useChat();
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const panelRef = useRef(null);
  const prevUnreadCount = useRef(unreadCount);

  useEffect(() => {
    if (unreadCount > prevUnreadCount.current) {
      playBellSound();
    }
    prevUnreadCount.current = unreadCount;
  }, [unreadCount]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await api.get('/dashboard/notifications');
        setHistory(data.notifications || []);
      } catch {
        // ignore
      }
    };
    fetchHistory();
  }, [open]);

  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const allNotifications = [...notifications, ...(history || [])].slice(0, 20);

  const markAllRead = async () => {
    try {
      await api.put('/dashboard/notifications/read');
      clearNotifications();
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          if (!open) markAllRead();
        }}
        className="relative rounded-full border border-gray-200 p-2.5 text-gray-600 transition hover:border-pink-600 hover:text-pink-600"
        aria-label="Notifications"
      >
        <FaBell />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] animate-bounce items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-3">
            <p className="font-semibold text-gray-900">Notifications</p>
            <button type="button" onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
              <FaTimes />
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {allNotifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500">No notifications yet.</div>
            ) : (
              allNotifications.map((n, idx) => (
                <div key={n._id || idx} className="border-b border-gray-50 px-4 py-3 hover:bg-gray-50">
                  <p className={`text-sm ${n.read ? 'text-gray-600' : 'font-medium text-gray-900'}`}>{n.message || n.title}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {new Date(n.createdAt || Date.now()).toLocaleString()}
                  </p>
                  {n.type && (
                    <span className="mt-1 inline-block rounded-full bg-pink-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-pink-600">
                      {n.type}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
