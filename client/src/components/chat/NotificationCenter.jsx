import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaBell, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../../Context/ChatContext';
import api from '../../Services/api';

const PANEL_WIDTH = 360;
const VIEWPORT_MARGIN = 8;
const GAP_BELOW_TRIGGER = 8;

// A short, subtle two-note chime via Web Audio so no audio asset is needed.
const playBellSound = () => {
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

const NotificationCenter = () => {
  const { notifications, unreadCount, clearNotifications } = useChat();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [position, setPosition] = useState(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const prevUnreadCount = useRef(unreadCount);
  const hasMounted = useRef(false);

  // Stay silent on the initial load; chime only for genuinely new arrivals.
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      prevUnreadCount.current = unreadCount;
      return;
    }
    if (unreadCount > prevUnreadCount.current) {
      playBellSound();
    }
    prevUnreadCount.current = unreadCount;
  }, [unreadCount]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    const fetchHistory = async () => {
      try {
        const { data } = await api.get('/dashboard/notifications');
        if (active) setHistory(data.notifications || []);
      } catch {
        // ignore
      }
    };
    fetchHistory();
    return () => {
      active = false;
    };
  }, [open]);

  // The bell lives inside the narrow admin sidebar, so the panel is rendered in
  // a portal and anchored to the trigger's viewport rect. This keeps it clear of
  // the sidebar's overflow and clamps it inside the viewport at any width.
  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return undefined;
    }

    const place = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const width = Math.min(PANEL_WIDTH, viewportWidth - VIEWPORT_MARGIN * 2);
      // Right-align the panel with the bell, then clamp so it never runs off
      // the left edge on narrow screens.
      const left = Math.min(
        Math.max(rect.right - width, VIEWPORT_MARGIN),
        viewportWidth - width - VIEWPORT_MARGIN
      );
      const top = rect.bottom + GAP_BELOW_TRIGGER;
      setPosition({
        left,
        top,
        width,
        maxHeight: Math.max(160, viewportHeight - top - VIEWPORT_MARGIN),
      });
    };

    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (e) => {
      if (panelRef.current?.contains(e.target) || triggerRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  // A live socket push and the persisted copy describe the same event, so key
  // on message + timestamp to avoid showing each admin notification twice.
  const allNotifications = useMemo(() => {
    const seen = new Set();
    return [...(notifications || []), ...(history || [])]
      .filter((n) => {
        const key = `${n.message || n.title || ''}|${new Date(n.createdAt || 0).getTime()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 20);
  }, [notifications, history]);

  const markAllRead = async () => {
    try {
      await api.put('/dashboard/notifications/read');
      clearNotifications();
      setHistory((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // ignore
    }
  };

  const openNotification = (n) => {
    if (n.enquiryId) {
      navigate(`/admin/enquiries?enquiry=${n.enquiryId}`);
    } else {
      navigate(n.navigateTo || '/admin');
    }
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-full border border-gray-200 p-2.5 text-gray-600 transition hover:border-pink-600 hover:text-pink-600"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <FaBell />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] animate-bounce items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open &&
        position &&
        createPortal(
          <div
            ref={panelRef}
            style={{
              position: 'fixed',
              left: position.left,
              top: position.top,
              width: position.width,
              maxHeight: position.maxHeight,
            }}
            className="z-[80] flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl"
          >
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-3">
                <p className="font-semibold text-gray-900">Notifications</p>
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-xs font-semibold text-pink-600 transition hover:text-pink-700"
                >
                  Mark all read
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-gray-400 transition hover:text-gray-600"
                  aria-label="Close notifications"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain">
                {allNotifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-500">No notifications yet.</div>
                ) : (
                  allNotifications.map((n, idx) => (
                    <button
                      key={n._id || n.id || idx}
                      type="button"
                      onClick={() => openNotification(n)}
                      title={n.message || n.title}
                      className="block w-full border-b border-gray-50 px-4 py-3 text-left transition hover:bg-gray-50"
                    >
                      <p
                        className={`whitespace-pre-line break-words text-sm ${
                          n.read ? 'text-gray-600' : 'font-medium text-gray-900'
                        }`}
                      >
                        {n.message || n.title}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {new Date(n.createdAt || Date.now()).toLocaleString()}
                      </p>
                      {n.type && (
                        <span className="mt-1 inline-block rounded-full bg-pink-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-pink-600">
                          {n.type}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default NotificationCenter;
