import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaBell, FaTimes, FaEnvelope, FaShoppingCart, FaHeart, FaGift, FaExclamationCircle, FaTag, FaTrashAlt, FaCreditCard } from 'react-icons/fa';
import useNotifications from '../../hooks/useNotifications';
import { useAuth } from '../../Context/Authcontext';
import { buildNotificationLink } from '../../utils/notificationLinks';
import toast from 'react-hot-toast';

const TYPE_ICONS = {
  enquiry: FaExclamationCircle,
  order: FaShoppingCart,
  message: FaEnvelope,
  system: FaBell,
  deal: FaGift,
  wishlist: FaHeart,
  rewards: FaGift,
  price: FaTag,
  payment: FaCreditCard,
};

const TYPE_COLORS = {
  enquiry: 'text-red-600',
  order: 'text-blue-600',
  message: 'text-green-600',
  system: 'text-gold-600',
  deal: 'text-purple-600',
  wishlist: 'text-pink-600',
  rewards: 'text-orange-600',
  price: 'text-primary',
  payment: 'text-emerald-600',
};

const getTypeLabel = (type) => {
  switch (type) {
    case 'enquiry': return 'Enquiry';
    case 'order': return 'Order';
    case 'message': return 'Message';
    case 'system': return 'System';
    case 'deal': return 'Deal';
    case 'wishlist': return 'Wishlist';
    case 'rewards': return 'Rewards';
    case 'price': return 'Price';
    case 'payment': return 'Payment';
    default: return 'Notification';
  }
};

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const NotificationBell = ({ badgeClassName = '' }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    markAllRead,
    markOneRead,
    clearAll,
  } = useNotifications(isAuthenticated);
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleOpen = () => {
    setOpen((o) => !o);
  };

  const handleNotificationClick = (notif) => {
    markOneRead(notif);
    setOpen(false);
    navigate(buildNotificationLink(notif, 'customer'));
  };

  const handleClearAll = async () => {
    await clearAll();
    toast.success('All notifications cleared');
    setOpen(false);
  };

  const totalDisplay = unreadCount > 9 ? '9+' : unreadCount;

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={handleOpen}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-gold/40 text-ink-light transition hover:border-primary hover:text-primary sm:h-11 sm:w-11"
        aria-label="Notifications"
      >
        <FaBell />
        {unreadCount > 0 && (
          <span className={`absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-bold text-white shadow ${badgeClassName}`}>
            {totalDisplay}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-gold/20 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-gold/20 bg-cream/50 px-4 py-3">
            <p className="font-semibold text-ink">Notifications</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="-mr-2 inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Close notifications"
            >
              <FaTimes />
            </button>
          </div>
          <div className="flex items-center justify-between border-b border-gray-50 px-4 py-2">
            <button
              type="button"
              onClick={markAllRead}
              className="text-xs font-semibold text-primary transition hover:text-primary-dark"
            >
              Mark all as read
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="flex items-center gap-1 text-xs font-semibold text-red-600 transition hover:text-red-700"
            >
              <FaTrashAlt className="text-[10px]" /> Clear all
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-sm text-gray-500">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500">No notifications yet.</div>
            ) : (
              notifications.map((notif) => {
                const TypeIcon = TYPE_ICONS[notif.type] || FaBell;
                const iconColor = TYPE_COLORS[notif.type] || 'text-gray-600';
                return (
                  <div
                    key={notif._id}
                    className={`border-b border-gray-50 px-4 py-3 hover:bg-cream/50 cursor-pointer transition ${!notif.read ? 'bg-red-50/30' : ''}`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 shrink-0 ${iconColor}`}>
                        <TypeIcon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm ${notif.read ? 'text-gray-600' : 'font-medium text-ink'}`}>
                          {notif.shortMessage || notif.message}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-[10px] text-gray-400">{timeAgo(notif.createdAt)}</span>
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-semibold uppercase text-gray-500">
                            {getTypeLabel(notif.type)}
                          </span>
                        </div>
                      </div>
                      {!notif.read && (
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {notifications.length > 0 && (
            <div className="border-t border-gray-50 px-4 py-2 text-center">
              <Link
                to="/dashboard"
                onClick={() => setOpen(false)}
                className="text-xs font-semibold text-primary transition hover:text-primary-dark"
              >
                View all in Dashboard
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;