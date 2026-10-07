import React, { useEffect, useState, useCallback, useRef, Fragment } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  FaBoxOpen, FaTruck, FaCheckCircle, FaTimesCircle,
  FaShoppingBag, FaClipboardList, FaUser, FaArrowRight,
  FaHeart, FaStar, FaClock, FaCommentDots, FaTag, FaEye,
  FaExchangeAlt, FaRedo, FaPhone, FaTrash,
  FaCopy, FaTrophy, FaMedal, FaGift, FaEyeSlash, FaSave,
  FaPlus, FaEnvelope, FaTimes,
  FaCamera, FaBan, FaUndo, FaDownload, FaPhoneAlt, FaMapMarkerAlt, FaCheck,
  FaChevronLeft, FaChevronRight, FaHome
} from 'react-icons/fa';
import api from '../../Services/api';
import { useAuth } from '../../Context/Authcontext';
import { useCart } from '../../Context/CartContext';
import { useChat } from '../../Context/ChatContext';
import Avatar from '../../components/common/Avatar';
import wishlistApi from '../../Services/wishlistApi';
import toast from 'react-hot-toast';
import { getCloudinaryOptimizedUrl, getAbsoluteImageUrl, handleImageError, getMainImage } from '../../utils/imageOptimizer';
import {
  PHONE_ERROR_CLASS,
  PHONE_ERROR_MESSAGE,
  PHONE_INPUT_PROPS,
  isValidNepaliPhone,
  sanitizePhone,
} from '../../utils/validatePhone';
import ProfileAvatarUpload from '../../components/customer/ProfileAvatarUpload';
import OrderActions from '../../components/customer/OrderActions';
import AddressManager from '../../components/customer/AddressManager';
import RewardsPanel from '../../components/customer/RewardsPanel';
import DangerZone from '../../components/customer/DangerZone';

const money = (n) => `Rs. ${Number(n || 0).toLocaleString()}`;

const STATUS_BADGE = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-indigo-100 text-indigo-700',
  packed: 'bg-purple-100 text-purple-700',
  shipped: 'bg-cyan-100 text-cyan-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const ORDER_FLOW = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered'];

// Must match CANCELLABLE_ORDER_STATUSES / isDeletableOrder on the server, or the
// button appears for an action the API will reject.
const CANCELLABLE_ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'packed'];
const isDeletableOrder = (order) =>
  order.orderStatus === 'cancelled' ||
  order.orderStatus === 'delivered' ||
  order.paymentStatus === 'failed';

const ENQUIRY_STATUS = {
  pending: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pending' },
  price_shared: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Price Shared' },
  negotiating: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Negotiating' },
  customer_agreed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Agreed' },
  deal_closed: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Deal Closed' },
  rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' },
  converted: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Converted' },
};

// Enquiries still open for negotiation: the customer can agree, counter, or
// request a call until the deal is closed, rejected, or converted.
const CLOSED_ENQUIRY_STATUSES = ['customer_agreed', 'deal_closed', 'rejected', 'converted'];

// Instant-support numbers shown on every open enquiry, tappable to dial.
const SUPPORT_PHONE_NUMBERS = ['9768562128', '9845423800'];

const MARQUEE_DURATION = 26;

const DASHBOARD_SECTIONS = [
  { id: 'overview', label: 'Overview', icon: FaStar },
  { id: 'orders', label: 'Orders', icon: FaBoxOpen },
  { id: 'messages', label: 'Messages', icon: FaCommentDots },
  { id: 'enquiries', label: 'Enquiries', icon: FaTag },
  { id: 'wishlist', label: 'Wishlist', icon: FaHeart },
  { id: 'profile', label: 'Profile', icon: FaUser },
  { id: 'rewards', label: 'Rewards', icon: FaTrophy },
];

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

const getImageUrl = (images, fallbackText = 'Product') => {
  if (!images || !images.length) {
    return getAbsoluteImageUrl(getMainImage(null, fallbackText).url) || '';
  }
  const main = getMainImage(images, fallbackText);
  return getAbsoluteImageUrl(getCloudinaryOptimizedUrl(main.url || main, 300));
};

const ContinuousTypewriter = ({ words = [], speed = 80, deleteSpeed = 50, pause = 2000, className = '' }) => {
  const [wordIndex, setWordIndex] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[wordIndex];
    if (!isDeleting && displayed === currentWord) {
      const timeout = setTimeout(() => setIsDeleting(true), pause);
      return () => clearTimeout(timeout);
    }
    if (isDeleting && displayed === '') {
      setIsDeleting(false);
      setWordIndex((prev) => (prev + 1) % words.length);
      return;
    }
    const timeout = setTimeout(() => {
      if (isDeleting) {
        setDisplayed((prev) => prev.slice(0, -1));
      } else {
        setDisplayed((prev) => prev + currentWord[prev.length]);
      }
    }, isDeleting ? deleteSpeed : speed);
    return () => clearTimeout(timeout);
  }, [displayed, isDeleting, wordIndex, words, speed, deleteSpeed, pause]);

  return (
    <span className={className}>
      {displayed}
      <span className="ml-0.5 inline-block h-5 w-1 animate-pulse bg-primary-800 align-middle" />
    </span>
  );
};

const Dashboard = () => {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const { addToCart } = useCart();
  const { socketRef } = useChat();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  // Sections are addressable two ways: ?tab=orders from a notification deep
  // link, and #orders from the tab strip. The query wins when both are present.
  const hashSection = location.hash?.replace('#', '') || '';
  const tabSection = searchParams.get('tab') || '';
  const requested = tabSection || hashSection;
  const active = DASHBOARD_SECTIONS.some((s) => s.id === requested) ? requested : 'overview';

  // The id of the exact row a notification was about, if it carried one.
  const focusOrderId = searchParams.get('order');
  const focusEnquiryId = searchParams.get('enquiry');
  const focusChatId = searchParams.get('chat');
  const focusId = focusOrderId || focusEnquiryId || focusChatId;
  const [highlightId, setHighlightId] = useState(null);
  const cardRefs = useRef({});

  const [dash, setDash] = useState(null);
  const [orders, setOrders] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loyalty, setLoyalty] = useState(null);
  const [referralCode, setReferralCode] = useState('');
  const [profile, setProfile] = useState(null);
  const [editProfile, setEditProfile] = useState(null);
  const [profilePhoneError, setProfilePhoneError] = useState(false);
  const [profilePhoneTouched, setProfilePhoneTouched] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enquiriesLoading, setEnquiriesLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [counterId, setCounterId] = useState(null);
  const [counterPrice, setCounterPrice] = useState('');
  const [counterMsg, setCounterMsg] = useState('');
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [cancelOrderId, setCancelOrderId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [deleteOrderId, setDeleteOrderId] = useState(null);
  const [enquiryUnreadCount, setEnquiryUnreadCount] = useState(0);
  const fileInputRef = useRef(null);
  const tabStripRef = useRef(null);
  const trackRef = useRef(null);
  const touchStartXRef = useRef(null);
  const resumeTimerRef = useRef(null);
  const [marqueePaused, setMarqueePaused] = useState(false);
  const [wideScreen, setWideScreen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [viewportTick, setViewportTick] = useState(0);

  const activeIndex = Math.max(
    0,
    DASHBOARD_SECTIONS.findIndex((s) => s.id === active)
  );

  // The marquee only earns its keep below lg, where tabs are actually cut off,
  // and never when the reader has asked for less motion.
  const useMarquee = !wideScreen && !reducedMotion;

  useEffect(() => {
    const mqWide = window.matchMedia('(min-width: 1024px)');
    const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      setWideScreen(mqWide.matches);
      setReducedMotion(mqReduce.matches);
    };
    sync();
    mqWide.addEventListener('change', sync);
    mqReduce.addEventListener('change', sync);
    return () => {
      mqWide.removeEventListener('change', sync);
      mqReduce.removeEventListener('change', sync);
    };
  }, []);

  useEffect(() => {
    let frame;
    const onResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setViewportTick((t) => t + 1));
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  useEffect(() => () => clearTimeout(resumeTimerRef.current), []);

  useEffect(() => {
    if (!useMarquee) return undefined;
    clearTimeout(resumeTimerRef.current);
    setMarqueePaused(true);
    resumeTimerRef.current = setTimeout(() => setMarqueePaused(false), 1400);
    return () => clearTimeout(resumeTimerRef.current);
  }, [active, useMarquee, viewportTick]);

  // Centre the active tab without touching scrollLeft, which a transform
  // driven marquee does not use. A negative animation-delay picks the point
  // in the 26s cycle at which that tab sits in the middle of the window.
  useEffect(() => {
    const track = trackRef.current;
    const window_ = tabStripRef.current;
    if (!useMarquee || !track || !window_) return;

    const tab = track.querySelector(`[data-tab-id="${active}"]`);
    if (!tab) return;

    const half = track.scrollWidth / 2;
    if (!half) return;

    let offset = tab.offsetLeft + tab.offsetWidth / 2 - window_.clientWidth / 2;
    offset = ((offset % half) + half) % half;

    track.style.animation = 'none';
    void track.offsetWidth;
    track.style.animation = '';
    track.style.animationDelay = `-${(offset / half) * MARQUEE_DURATION}s`;
  }, [active, useMarquee, viewportTick]);

  // Without the marquee the strip scrolls natively, so centre by scrollLeft.
  // scrollIntoView is avoided here because it also scrolls every scrollable
  // ancestor, including the document, which parks the top of the dashboard
  // underneath the sticky navbar on load.
  useEffect(() => {
    if (useMarquee) return;
    const strip = tabStripRef.current;
    const tab = strip?.querySelector(`[data-tab-id="${active}"]`);
    if (!strip || !tab) return;
    const target = tab.offsetLeft - (strip.clientWidth - tab.offsetWidth) / 2;
    const max = strip.scrollWidth - strip.clientWidth;
    strip.scrollTo({ left: Math.max(0, Math.min(target, max)), behavior: 'smooth' });
  }, [active, loading, useMarquee]);

// When a notification deep link carries an id, scroll that card into view and
// flash it so it is obvious which record the alert was about.
useEffect(() => {
    if (!focusId || loading) return;
    setHighlightId(focusId);
  }, [focusId, loading]);

// Scrolling is keyed off the highlight alone so a background refetch of the
// lists cannot cancel the scroll before it runs.
useEffect(() => {
    if (!highlightId) return undefined;
    const scrollTimer = setTimeout(() => {
      cardRefs.current[highlightId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
    const clearTimer = setTimeout(() => setHighlightId(null), 5000);
    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(clearTimer);
    };
  }, [highlightId]);

const stepSection = (delta) => {
    const next = DASHBOARD_SECTIONS[activeIndex + delta];
    if (next) switchSection(next.id);
  };

  const holdMarquee = () => {
    clearTimeout(resumeTimerRef.current);
    setMarqueePaused(true);
  };

  const releaseMarquee = () => {
    clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => setMarqueePaused(false), 1200);
  };

  const onTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
    holdMarquee();
  };

  const onTouchEnd = (e) => {
    const startX = touchStartXRef.current;
    touchStartXRef.current = null;
    releaseMarquee();
    if (startX == null) return;
    const deltaX = e.changedTouches[0].clientX - startX;
    if (Math.abs(deltaX) < 48) return;
    stepSection(deltaX < 0 ? 1 : -1);
  };

const loadDashboard = useCallback(async (signal) => {
    const settled = await Promise.allSettled([
      api.get('/dashboard', { signal }).catch(() => null),
      api.get('/orders/my-orders', { signal }).then((r) => r?.data?.orders ?? []).catch((err) => {
        if (err?.name !== 'CanceledError' && err?.name !== 'AbortError') setOrdersError(true);
        return [];
      }),
      api.get('/enquiries/my', { signal }).catch(() => null),
      wishlistApi.getWishlist().catch(() => null),
      api.get('/conversations', { signal }).catch(() => null),
      api.get('/loyalty', { signal }).catch(() => null),
      api.get('/loyalty/referral', { signal }).catch(() => null),
      api.get('/users/profile', { signal }).catch(() => null),
    ]);
    if (signal?.aborted) return;
    const [d, o, e, w, c, l, r, p] = settled;
    setDash(d.status === 'fulfilled' && d.value?.data ? d.value.data.dashboard : {});
    setOrders(o.status === 'fulfilled' ? o.value : []);
    setEnquiries(e.status === 'fulfilled' && e.value?.data ? e.value.data.enquiries || [] : []);
    setWishlistItems(w.status === 'fulfilled' ? w.value?.wishlist?.items || [] : []);
    setConversations(c.status === 'fulfilled' && c.value?.data ? c.value.data.conversations : []);
    setLoyalty(l.status === 'fulfilled' ? l.value?.data : null);
    setReferralCode(r.status === 'fulfilled' ? r.value?.data?.referralCode || '' : '');
    setProfile(p.status === 'fulfilled' && p.value?.data ? p.value.data.user : null);
    setEnquiriesLoading(false);
    setLoading(false);
  }, []);

  const retryOrders = useCallback(async () => {
    setOrdersError(false);
    setOrdersLoading(true);
    try {
      const { data } = await api.get('/orders/my-orders');
      setOrders(data?.orders || []);
    } catch {
      setOrdersError(true);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { navigate('/login'); return; }
    const controller = new AbortController();
    loadDashboard(controller.signal);
    return () => controller.abort();
  }, [authLoading, isAuthenticated, navigate, loadDashboard]);

  useEffect(() => {
    if (profile) {
      setEditProfile(profile);
      setProfilePhoneTouched(false);
      setProfilePhoneError(false);
    }
  }, [profile]);

  // Enquiry unread count - fetch + poll + socket
  useEffect(() => {
    if (!isAuthenticated || !user?._id) return;
    let pollInterval;
    const fetchUnread = async () => {
      try {
        const { data } = await api.get('/enquiries/unread-count');
        setEnquiryUnreadCount(data.unreadCount || 0);
      } catch { /* ignore */ }
    };
    fetchUnread();
    pollInterval = setInterval(fetchUnread, 15000);
    return () => clearInterval(pollInterval);
  }, [isAuthenticated, user?._id]);

  // Socket listener for real-time enquiry updates
  useEffect(() => {
    if (!isAuthenticated || !user?._id) return;
    const socket = socketRef?.current;
    if (!socket) return;
    const handler = () => {
      try {
        api.get('/enquiries/unread-count').then(({ data }) => setEnquiryUnreadCount(data.unreadCount || 0));
      } catch { /* ignore */ }
    };
    socket.on('enquiry:reply', handler);
    socket.on('enquiry:counter', handler);
    socket.on('enquiry:deal_closed', handler);
    socket.on('enquiry:new', handler);
    return () => {
      socket.off('enquiry:reply', handler);
      socket.off('enquiry:counter', handler);
      socket.off('enquiry:deal_closed', handler);
      socket.off('enquiry:new', handler);
    };
  }, [isAuthenticated, user?._id, socketRef]);

  // Update browser tab title with unread count
  useEffect(() => {
    const baseTitle = "Sunita'z Collection — Dashboard";
    if (enquiryUnreadCount > 0) {
      document.title = `(${enquiryUnreadCount}) ${baseTitle}`;
    } else {
      document.title = baseTitle;
    }
  }, [enquiryUnreadCount]);

  // Clear unread count when Enquiries tab is opened
  useEffect(() => {
    if (active === 'enquiries' && enquiryUnreadCount > 0) {
      setEnquiryUnreadCount(0);
    }
  }, [active, enquiryUnreadCount]);

  const d = dash || {};
  const profileData = profile || d.user || { name: user?.name || 'there', avatar: user?.avatar, email: user?.email };
  const firstName = String(profileData?.name || user?.name || 'there').split(' ')[0];

  const orderSummary = {
    total: orders.length,
    active: orders.filter((o) => ['pending', 'confirmed', 'processing', 'packed', 'shipped'].includes(o.orderStatus)).length,
    delivered: orders.filter((o) => o.orderStatus === 'delivered').length,
    cancelled: orders.filter((o) => o.orderStatus === 'cancelled').length,
  };

  const totalSpent = orders.filter((o) => o.paymentStatus !== 'failed').reduce((a, o) => a + Number(o.totalAmount || 0), 0);

  // Sections swap in place, so the scroll offset has to be reset with them —
  // otherwise moving from the foot of Overview to Orders drops you mid-page,
  // underneath the sticky navbar.
  const switchSection = (id) => {
    // Switching sections by hand drops any stale deep-link focus, and replaces
    // rather than pushes so the browser Back button still leaves the dashboard.
    const next = new URLSearchParams(searchParams);
    next.set('tab', id);
    ['order', 'enquiry', 'chat'].forEach((key) => next.delete(key));
    const query = next.toString();
    navigate(`/dashboard${query ? `?${query}` : ''}`, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const reorder = async (order) => {
    try {
      for (const item of order.items || []) {
        await addToCart(
          { _id: item.product, name: item.name, price: item.price, image: item.image, stock: 999, variants: item.variantSku ? [{ sku: item.variantSku }] : [] },
          item.quantity,
          item.variantSku ? { sku: item.variantSku } : null
        );
      }
      navigate('/cart');
    } catch { toast.error('Reorder failed'); }
  };

  const handleAgree = async (enq) => {
    setActionLoading(enq._id);
    try {
      const { data } = await api.post(`/enquiries/${enq._id}/customer-agree`, { message: 'I agree with the price' });
      toast.success(`Deal confirmed at ${money(data.enquiry.dealPrice)}`);
      setEnquiries((prev) => prev.map((e) => (e._id === enq._id ? data.enquiry : e)));
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to agree'); }
    finally { setActionLoading(null); }
  };

  const handleCounterSubmit = async (enq) => {
    const price = Number(counterPrice);
    if (!price || price <= 0) return toast.error('Enter a valid counter price');
    setActionLoading(enq._id);
    try {
      const { data } = await api.post(`/enquiries/${enq._id}/counter`, { message: counterMsg.trim() || 'Counter offer', price });
      toast.success('Counter offer sent');
      setCounterId(null); setCounterPrice(''); setCounterMsg('');
      setEnquiries((prev) => prev.map((e) => (e._id === enq._id ? data.enquiry : e)));
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActionLoading(null); }
  };

  const handleCall = async (enq) => {
    setActionLoading(enq._id);
    try {
      const { data } = await api.post(`/enquiries/${enq._id}/request-call`);
      toast.success('Call requested. Admin will contact you shortly.');
      setEnquiries((prev) => prev.map((e) => (e._id === enq._id ? data.enquiry : e)));
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActionLoading(null); }
  };

  const handleDeleteEnquiry = async (id) => {
    if (!window.confirm('Delete this enquiry?')) return;
    try { await api.delete(`/enquiries/${id}`); setEnquiries((prev) => prev.filter((e) => e._id !== id)); toast.success('Enquiry deleted'); }
    catch { toast.error('Failed to delete'); }
  };

  const handleAddToCartDeal = async (enq) => {
    try {
      await addToCart(
        { _id: enq.productId?._id, name: enq.productId?.name || 'Product', price: enq.dealPrice || enq.quotedPrice, image: '', stock: 999, variants: [] },
        1, null, enq.dealPrice || enq.quotedPrice
      );
      navigate('/checkout');
    } catch { toast.error('Failed to add to cart'); }
  };

  const handleCancelOrder = async (orderId) => {
    if (!cancelReason.trim()) return toast.error('Please provide a cancellation reason');
    setActionLoading(orderId);
    try {
      const { data } = await api.put(`/orders/${orderId}/cancel`, { reason: cancelReason });
      toast.success('Order cancelled');
      setOrders((prev) => prev.map((o) => (o._id === orderId ? data.order : o)));
      setCancelOrderId(null);
      setCancelReason('');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to cancel'); }
    finally { setActionLoading(null); }
  };

  const handleDeleteOrder = async (orderId) => {
    setActionLoading(orderId);
    try {
      await api.delete(`/orders/${orderId}`);
      toast.success('Order deleted');
      setOrders((prev) => prev.filter((o) => o._id !== orderId));
      setDeleteOrderId(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete'); }
    finally { setActionLoading(null); }
  };

  const handleDownloadInvoice = async (order) => {
    try {
      const { data } = await api.get(`/orders/${order._id}/invoice`, { responseType: 'text' });
      const newWindow = window.open('', '_blank');
      newWindow.document.write(data);
      newWindow.document.close();
      newWindow.focus();
      newWindow.print();
    } catch { toast.error('Failed to load invoice'); }
  };

  const handleProfilePhoneChange = (e) => {
    const digits = sanitizePhone(e.target.value);
    setEditProfile((prev) => ({ ...prev, phone: digits }));
    if (profilePhoneTouched) setProfilePhoneError(!isValidNepaliPhone(digits));
  };

  const handleProfilePhoneBlur = () => {
    setProfilePhoneTouched(true);
    setProfilePhoneError(!isValidNepaliPhone(editProfile?.phone));
  };

  const handleProfileSave = async () => {
    if (!editProfile) return;

    if (editProfile.phone) {
      setProfilePhoneTouched(true);
      if (!isValidNepaliPhone(editProfile.phone)) {
        setProfilePhoneError(true);
        return;
      }
    }

    setSaving(true);
    try {
      const { data } = await api.put('/users/profile', { name: editProfile.name, phone: editProfile.phone, address: editProfile.address });
      toast.success('Profile updated');
      setProfile(data.user);
    } catch (err) { toast.error(err.response?.data?.message || 'Unable to update profile'); }
    finally { setSaving(false); }
  };

  const handlePasswordSave = async () => {
    if (pwd.new !== pwd.confirm) return toast.error('New passwords do not match');
    setSaving(true);
    try {
      const { data } = await api.put('/users/profile/password', { currentPassword: pwd.current, newPassword: pwd.next });
      toast.success(data.message || 'Password changed');
      setPwd({ current: '', next: '', confirm: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Unable to change password'); }
    finally { setSaving(false); }
  };

  const copyReferral = async () => {
    if (!referralCode) return;
    const link = `${window.location.origin}/r/${referralCode}`;
    try { await navigator.clipboard.writeText(link); toast.success('Referral link copied!'); }
    catch { toast.error('Could not copy link'); }
  };

  const latestAdminMsg = (enq) => {
    if (enq?.messages && enq.messages.length) {
      for (let i = enq.messages.length - 1; i >= 0; i--) {
        if (enq.messages[i]?.senderRole === 'admin' || enq.messages[i]?.sender === 'admin') {
          return enq.messages[i];
        }
      }
    }
    if (!enq?.messages) {
      if (enq?.quotedPrice) return { text: `Quoted price: ${money(enq.quotedPrice)}`, price: enq.quotedPrice };
      if (enq?.adminNote) return { text: enq.adminNote, price: enq.price };
    }
    return null;
  };

  const hasActiveDeal = (enq) => ['price_shared', 'negotiating', 'customer_agreed'].includes(enq.status);

if (loading) {
    return (
      <div className="bg-cream py-6 sm:py-8">
        <div className="container-custom px-4 lg:px-8">
          <div className="mb-6 flex gap-2 overflow-hidden">
            {[...DASHBOARD_SECTIONS].map((section) => (
              <div key={section.id} className="h-11 w-24 shrink-0 animate-pulse rounded-full bg-white/70" />
            ))}
          </div>
          <div className="h-44 animate-pulse rounded-3xl bg-gradient-to-br from-primary-200 to-primary-100 sm:h-52" />
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-3xl bg-white/70" />
            ))}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-white/70" />
            ))}
          </div>
          <div className="mt-6 h-64 animate-pulse rounded-3xl bg-white/70" />
        </div>
      </div>
    );
  }

  return (
    <Fragment>
    <div className="bg-cream py-6 sm:py-8">
      <div className="container-custom px-4 lg:px-8">
        {/* Tab Bar — a seamless marquee below lg where tabs overflow, and a
            plain scrollable row on wide screens or under reduced motion. */}
        <div className="mb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/')}
              aria-label="Back to home"
              className="inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-full border border-gold/50 bg-white/80 px-3 py-2 text-sm font-semibold text-primary transition hover:border-primary hover:bg-primary hover:text-white sm:px-4"
            >
              <FaHome className="shrink-0 text-xs" />
              <span className="hidden whitespace-nowrap sm:inline">Back to Home</span>
            </button>

            <button
              type="button"
              onClick={() => stepSection(-1)}
              disabled={activeIndex === 0}
              aria-label="Previous section"
              className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/40 text-primary disabled:opacity-30 sm:inline-flex"
            >
              <FaChevronLeft />
            </button>

            <div
              ref={tabStripRef}
              role="tablist"
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
              className={
                useMarquee
                  ? `tab-marquee min-w-0 flex-1 ${marqueePaused ? 'tab-marquee--paused' : ''}`
                  : 'scrollbar-none -mx-1 flex min-w-0 flex-1 gap-2 overflow-x-auto px-1 pb-2'
              }
            >
              <div ref={trackRef} className={useMarquee ? 'tab-marquee__track' : 'contents'}>
                {(useMarquee ? [0, 1] : [0]).map((copy) => (
                  <div
                    key={copy}
                    aria-hidden={copy === 1 ? 'true' : undefined}
                    className={useMarquee ? 'flex shrink-0 gap-2 pr-2' : 'contents'}
                  >
                    {DASHBOARD_SECTIONS.map((section) => {
                      const Icon = section.icon;
                      const isActiveTab = active === section.id;
                      const showBadge = section.id === 'enquiries' && enquiryUnreadCount > 0 && !isActiveTab;
                      return (
                        <button
                          key={section.id}
                          data-tab-id={section.id}
                          role="tab"
                          tabIndex={copy === 1 ? -1 : 0}
                          aria-selected={isActiveTab}
                          onClick={() => switchSection(section.id)}
                          className={`relative flex min-h-[44px] shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition sm:px-5 ${
                            isActiveTab
                              ? 'bg-primary text-white'
                              : 'bg-white text-gray-700 hover:bg-primary/5 hover:text-primary'
                          }`}
                        >
                          <Icon className="shrink-0 text-xs" />
                          <span className="whitespace-nowrap">{section.label}</span>
                          {showBadge && (
                            <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white shadow">
                              {enquiryUnreadCount > 9 ? '9+' : enquiryUnreadCount}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => stepSection(1)}
              disabled={activeIndex === DASHBOARD_SECTIONS.length - 1}
              aria-label="Next section"
              className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/40 text-primary disabled:opacity-30 sm:inline-flex"
            >
              <FaChevronRight />
            </button>
          </div>
          <div className="mt-1 h-px bg-gold/20 sm:hidden" />
        </div>

        {/* Overview Section */}
        {active === 'overview' && (
          <div className="space-y-6">
            {/* Welcome banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 px-6 py-10 text-white shadow-luxury">
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-gold-400/15 blur-3xl" />
                <div className="absolute -left-16 -bottom-16 h-72 w-72 rounded-full bg-pink-500/15 blur-3xl" />
              </div>
              <div className="relative flex flex-wrap items-center justify-between gap-6">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-300">Namaste,</p>
                  <h1 className="mt-2 font-serif text-3xl font-bold sm:text-4xl">
                    {firstName}!
                  </h1>
                  <p className="mt-2 text-white/90">
                    <ContinuousTypewriter
                      words={["Welcome back to Sunita'z Collections", 'Good to see you again', 'Here is what is new']}
                      speed={80}
                      deleteSpeed={50}
                      pause={2000}
                    />
                  </p>
                </div>
                <Avatar
                  src={profileData?.avatar}
                  name={profileData?.name || user?.name}
                  size="lg"
                  showBorder
                  borderColor="border-white/40"
                />
              </div>
            </div>

            {/* Order summary cards — 2 up on phones, 3 on tablets, 5 on desktop.
                The fifth card spans both mobile columns so the row never ends
                on a lone half-width tile. */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
              {[
                { icon: FaBoxOpen, label: 'Total Orders', value: orderSummary.total, section: 'orders', color: 'bg-primary-50 text-primary-600' },
                { icon: FaTruck, label: 'Active Orders', value: orderSummary.active, section: 'orders', color: 'bg-blue-50 text-blue-600' },
                { icon: FaCheckCircle, label: 'Delivered', value: orderSummary.delivered, section: 'orders', color: 'bg-green-50 text-green-600' },
                { icon: FaTimesCircle, label: 'Cancelled', value: orderSummary.cancelled, section: 'orders', color: 'bg-red-50 text-red-600' },
                { icon: FaHeart, label: 'Wishlist', value: wishlistItems.length, section: 'wishlist', color: 'bg-pink-50 text-pink-600' },
              ].map(({ icon: Icon, label, value, section, color }, index) => (
                <button
                  key={label}
                  onClick={() => switchSection(section)}
                  className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border border-gold/20 bg-white p-4 text-left shadow-card transition hover:shadow-luxury sm:p-5 ${
                    index === 4 ? 'col-span-2 md:col-span-1' : ''
                  }`}
                >
                  <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-gold-100/40 blur-xl transition group-hover:scale-150" />
                  <div className="relative flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm text-ink-light">{label}</p>
                      <p className="mt-1 text-2xl font-bold text-ink">{value}</p>
                    </div>
                    <div className={`shrink-0 rounded-2xl p-3 ${color}`}>{Icon && <Icon className="text-xl" />}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Quick Actions — 2 equal columns on phones, 3 on tablets, 5 on
                desktop. The fifth spans both mobile columns so the grid ends
                on a full-width tile instead of a stranded half. */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
              {[
                { id: 'shop', label: 'Shop Now', to: '/shop', icon: FaShoppingBag },
                { id: 'orders', label: 'View Orders', section: 'orders', icon: FaClipboardList },
                { id: 'enquiries', label: 'My Enquiries', section: 'enquiries', icon: FaTag },
                { id: 'wishlist', label: 'Wishlist', section: 'wishlist', icon: FaHeart },
                { id: 'rewards', label: 'Rewards', section: 'rewards', icon: FaTrophy },
              ].map((a, index) => {
                const ActionIcon = a.icon;
                const span = index === 4 ? 'col-span-2 lg:col-span-1' : '';
                const body = (
                  <div className="relative flex h-full items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-pink-50 text-pink-600">
                      <ActionIcon className="text-xl" />
                    </div>
                    <span className="min-w-0 text-sm font-semibold leading-tight text-ink">{a.label}</span>
                  </div>
                );
                return (
                  <div key={a.id} className={`h-full ${span}`}>
                    {a.to ? (
                      <Link to={a.to} className="block rounded-2xl border border-gold/20 bg-white p-4 text-left shadow-card transition hover:shadow-luxury">
                        {body}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => switchSection(a.section)}
                        className="min-h-[44px] w-full rounded-2xl border border-gold/20 bg-white p-4 text-left shadow-card transition hover:shadow-luxury"
                      >
                        {body}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Recent Orders */}
            <div className="rounded-3xl border border-gold/20 bg-white p-5 shadow-card sm:p-8">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-bold text-ink">Recent Orders</h2>
                <button
                  onClick={() => switchSection('orders')}
                  className="flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-800"
                >
                  View all <FaArrowRight className="text-xs" />
                </button>
              </div>
              {ordersError ? (
                <div className="rounded-2xl border border-dashed border-red-300 bg-red-50/50 p-8 text-center">
                  <FaTimesCircle className="mx-auto h-8 w-8 text-red-300" />
                  <p className="mt-3 text-sm font-semibold text-ink">We couldn't load your orders.</p>
                  <p className="mt-1 text-sm text-ink-light">Check your connection and try again.</p>
                  <button
                    onClick={retryOrders}
                    disabled={ordersLoading}
                    className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-50"
                  >
                    <FaExchangeAlt className={`text-sm ${ordersLoading ? 'animate-spin' : ''}`} />
                    {ordersLoading ? 'Retrying...' : 'Retry'}
                  </button>
                </div>
              ) : ordersLoading ? (
                <div className="space-y-3" aria-busy="true" aria-label="Loading recent orders">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-20 animate-pulse rounded-2xl border border-gold/10 bg-cream/60" />
                  ))}
                </div>
              ) : orders.length ? (
                <div className="space-y-3">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order._id} className="relative overflow-hidden rounded-2xl border border-gold/10 bg-cream/60 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-ink">{order.orderNumber}</p>
                          <p className="mt-0.5 text-xs text-ink-light">
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ''} · {money(order.totalAmount)}
                          </p>
                          {order.trackingNumber && (
                            <p className="mt-0.5 text-[11px] text-primary-600">Tracking: {order.trackingNumber}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE[order.orderStatus] || 'bg-gray-100 text-gray-700'}`}>
                            {order.orderStatus}
                          </span>
                          <button
                            onClick={() => reorder(order)}
                            className="text-xs font-semibold text-primary-600 hover:text-primary-800"
                          >
                            Reorder
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-gold/30 bg-cream/60 p-8 text-center">
                  <p className="text-sm text-ink-light">No orders yet — your order history will appear here.</p>
                  <Link
                    to="/shop"
                    className="mt-3 inline-block rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white hover:scale-105 hover:bg-primary-dark"
                  >
                    Start Shopping
                  </Link>
                </div>
              )}
            </div>

            {/* Rewards summary on overview */}
            {loyalty && (
              <div className="rounded-3xl border border-gold/20 bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 p-6 shadow-card">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-ink">Loyalty Points</h3>
                    <p className="mt-1 text-2xl font-bold text-primary">{loyalty.points || 0} pts</p>
                  </div>
                  <button
                    onClick={() => switchSection('rewards')}
                    className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-dark"
                  >
                    View Rewards
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Orders Section */}
        {active === 'orders' && (
          <div className="space-y-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-ink">My Orders</h2>
              <span className="text-sm text-ink-light">{orders.length} orders total</span>
            </div>
            {orders.length ? (
              orders.slice(0, 10).map((order) => (
                <div
                  key={order._id}
                  ref={(el) => { cardRefs.current[order._id] = el; }}
                  className={`rounded-3xl border bg-white p-5 shadow-card transition ${
                    highlightId === order._id
                      ? 'border-pink-400 ring-2 ring-pink-300'
                      : 'border-gold/20'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink">{order.orderNumber}</p>
                      <p className="mt-0.5 text-xs text-ink-light">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ''} · {money(order.totalAmount)}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE[order.orderStatus] || 'bg-gray-100 text-gray-700'}`}>
                      {order.orderStatus}
                    </span>
                  </div>
                  {order.items?.length > 0 && (
                    <div className="mt-3 flex items-center gap-2 overflow-x-auto">
                      {order.items.slice(0, 3).map((item, i) => (
                        <img
                          key={i}
                          src={getImageUrl(item?.images, item?.name || 'Product')}
                          alt={item.name || 'Product'}
                          className="h-12 w-12 rounded-lg object-cover border border-gold/20"
                          onError={handleImageError}
                        />
                      ))}
                      {order.items.length > 3 && <span className="text-xs text-ink-light">+{order.items.length - 3} more</span>}
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {order.trackingNumber && ['processing', 'packed', 'shipped', 'out_for_delivery'].includes(order.orderStatus) && (
                      <button
                        onClick={() => navigate(`/track-order/${order._id}`)}
                        className="flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary"
                      >
                        <FaTruck className="text-xs" /> Track
                      </button>
                    )}
                    {CANCELLABLE_ORDER_STATUSES.includes(order.orderStatus) && (
                      <button
                        onClick={() => { setCancelOrderId(order._id); setCancelReason(''); }}
                        disabled={actionLoading === order._id}
                        aria-label={`Cancel order ${order.orderNumber}`}
                        className="flex min-h-[44px] items-center gap-1 rounded-lg bg-red-100 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-200 disabled:opacity-50"
                      >
                        <FaTimesCircle className="text-xs" /> Cancel
                      </button>
                    )}
                    {isDeletableOrder(order) && (
                      <button
                        onClick={() => setDeleteOrderId(order._id)}
                        disabled={actionLoading === order._id}
                        aria-label={`Delete order ${order.orderNumber}`}
                        className="flex min-h-[44px] items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                      >
                        <FaTrash className="text-xs" /> Delete
                      </button>
                    )}
                    <button
                      onClick={() => reorder(order)}
                      disabled={actionLoading === order._id}
                      className="flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                    >
                      <FaRedo className="text-xs" /> Reorder
                    </button>
                    {order.orderStatus === 'delivered' && (
                      <button
                        onClick={() => handleDownloadInvoice(order)}
                        disabled={actionLoading === order._id}
                        className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
                      >
                        <FaDownload className="text-xs" /> Invoice
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-gold/30 bg-cream/60 p-8 text-center">
                <FaShoppingBag className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-3 text-sm text-ink-light">No orders yet.</p>
                <Link
                  to="/shop"
                  className="mt-3 inline-block rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
                >
                  Start Shopping
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Messages Section */}
        {active === 'messages' && (
          <div className="space-y-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-ink">Messages</h2>
              <Link
                to="/messages"
                className="flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-800"
              >
                Open Full Chat <FaArrowRight className="text-xs" />
              </Link>
            </div>
            {conversations.length ? (
              conversations.map((conv) => (
                <Link
                  key={conv._id}
                  to={`/messages?chat=${conv._id}`}
                  ref={(el) => { cardRefs.current[conv._id] = el; }}
                  className={`group block rounded-2xl border bg-white p-4 transition hover:border-gold/30 hover:bg-cream/30 ${
                    highlightId === conv._id
                      ? 'border-pink-400 ring-2 ring-pink-300'
                      : 'border-gold/10'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar
                      src={conv.customer?.avatar}
                      name={conv.customer?.name || conv.title || 'Sunita'}
                      size="md"
                      showBorder
                      borderColor="border-primary/20"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-ink">{conv.customer?.name || conv.title || "Sunita'z Collection"}</p>
                        <span className="text-xs text-ink-light">{timeAgo(conv.lastMessageAt)}</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600 truncate">{conv.lastMessagePreview || 'No messages yet'}</p>
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="shrink-0 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                        {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                      </span>
                    )}
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-gold/30 bg-cream/60 p-8 text-center">
                <FaCommentDots className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-3 text-sm text-ink-light">No messages yet.</p>
                <Link
                  to="/messages"
                  className="mt-3 inline-block rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
                >
                  Start a conversation
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Enquiries Section */}
        {active === 'enquiries' && (
          <div className="space-y-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-ink">My Enquiries</h2>
              <span className="text-sm text-ink-light">{enquiries.length} enquiries</span>
            </div>
            {enquiriesLoading ? (
              <div className="text-center py-8 text-ink-light">Loading your enquiries...</div>
            ) : enquiries.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gold/30 bg-cream/60 p-8 text-center">
                <FaTag className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-3 text-sm text-ink-light">You have no enquiries yet.</p>
                <Link
                  to="/shop"
                  className="mt-3 inline-block rounded-full bg-pink-600 px-6 py-2 text-sm font-semibold text-white hover:bg-pink-700"
                >
                  Start Enquiring
                </Link>
              </div>
            ) : (
              enquiries.map((enquiry) => {
                const sConfig = ENQUIRY_STATUS[enquiry.status || 'pending'] || ENQUIRY_STATUS.pending;
                const dealPrice = enquiry.dealPrice || enquiry.quotedPrice;
                const adminMsg = latestAdminMsg(enquiry);
                return (
                  <div
                    key={enquiry._id}
                    ref={(el) => { cardRefs.current[enquiry._id] = el; }}
                    className={`rounded-3xl border bg-white p-5 shadow-card transition ${
                      highlightId === enquiry._id
                        ? 'border-pink-400 ring-2 ring-pink-300'
                        : 'border-gold/20'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-ink">
                            {enquiry.productId?.name || enquiry.productName || 'General enquiry'}
                          </p>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${sConfig.bg} ${sConfig.text}`}>
                            {sConfig.label}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-ink-light">
                          {enquiry.createdAt ? new Date(enquiry.createdAt).toLocaleDateString() : ''}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {['customer_agreed', 'deal_closed'].includes(enquiry.status) && dealPrice && (
                          <button
                            onClick={() => handleAddToCartDeal(enquiry)}
                            className="flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-dark"
                          >
                            <FaShoppingBag className="text-xs" /> Buy at {money(dealPrice)}
                          </button>
                        )}
                        {enquiry.status !== 'converted' && (
                          <button
                            onClick={() => handleDeleteEnquiry(enquiry._id)}
                            className="flex items-center gap-1 rounded-full bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700"
                          >
                            <FaTrash className="text-xs" /> Delete
                          </button>
                        )}
                      </div>
                    </div>
                    {adminMsg && (
                      <div className="mt-3 rounded-xl border border-gold/20 bg-cream/60 p-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-ink-light">
                          <FaCommentDots className="text-gray-400" />
                          Admin Reply
                        </div>
                        <p className="mt-1 text-sm text-gray-700">{adminMsg.text}</p>
                        {adminMsg.price && (
                          <p className="mt-1 text-sm font-semibold text-pink-600">
                            <FaTag className="mr-1 inline" />
                            Price: {money(adminMsg.price)}
                          </p>
                        )}
                        {enquiry.dealPrice && (
                          <p className="text-sm font-semibold text-purple-600">
                            <FaTag className="mr-1 inline" />
                            Deal Price: {money(enquiry.dealPrice)}
                          </p>
                        )}
                        {(enquiry.status === 'price_shared' || enquiry.status === 'negotiating') && enquiry.quotedPrice && (
                          <p className="mt-2 text-xs text-ink-light">
                            Use the buttons below to agree, send a counter offer, or ask us to call you.
                          </p>
                        )}
                        {enquiry.status === 'deal_closed' && enquiry.dealPrice && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              disabled={actionLoading === enquiry._id}
                              onClick={() => handleAddToCartDeal(enquiry)}
                              className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-dark"
                            >
                              <FaShoppingBag className="text-xs" /> Add to Cart at {money(enquiry.dealPrice)}
                            </button>
                            <button
                              disabled={actionLoading === enquiry._id}
                              onClick={() => handleAddToCartDeal(enquiry)}
                              className="flex items-center gap-1 rounded-lg bg-pink-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-pink-700"
                            >
                              <FaCheck className="text-xs" /> Buy Now at {money(enquiry.dealPrice)}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Agree / Counter Offer / Call stay available for the whole
                        life of an open enquiry, even when the admin replied
                        with no price attached. */}
                    {!CLOSED_ENQUIRY_STATUSES.includes(enquiry.status) && (
                      <div className="mt-3 rounded-xl border border-pink-200 bg-pink-50/70 p-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-ink-light">
                          <FaPhoneAlt className="text-pink-500" />
                          Instant support &mdash; tap a number to call
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {SUPPORT_PHONE_NUMBERS.map((number) => (
                            <a
                              key={number}
                              href={`tel:${number}`}
                              className="flex items-center gap-1.5 rounded-full border border-pink-300 bg-white px-3 py-1.5 text-sm font-semibold text-pink-700 transition hover:bg-pink-600 hover:text-white"
                            >
                              <FaPhoneAlt className="text-xs" /> {number}
                            </a>
                          ))}
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {(enquiry.status === 'price_shared' || enquiry.status === 'negotiating') && enquiry.quotedPrice && (
                            <button
                              disabled={actionLoading === enquiry._id}
                              onClick={() => handleAgree(enquiry)}
                              className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                            >
                              <FaCheck className="text-xs" /> Agree at {money(enquiry.quotedPrice)}
                            </button>
                          )}
                          <div className="flex w-full flex-wrap items-center gap-1 sm:w-auto">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={counterPrice}
                              onChange={(e) => setCounterPrice(e.target.value)}
                              placeholder="Your counter price"
                              className="w-32 rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-pink-500"
                            />
                            <input
                              type="text"
                              value={counterMsg}
                              onChange={(e) => setCounterMsg(e.target.value)}
                              placeholder="Message (optional)"
                              className="min-w-[160px] flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-pink-500"
                            />
                            <button
                              disabled={actionLoading === enquiry._id || !counterPrice}
                              onClick={() => handleCounterSubmit(enquiry)}
                              className="rounded-lg bg-orange-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
                            >
                              Counter
                            </button>
                          </div>
                          <button
                            disabled={actionLoading === enquiry._id}
                            onClick={() => handleCall(enquiry)}
                            title="Ask us to call you back"
                            className="flex items-center gap-1 rounded-lg bg-pink-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-50"
                          >
                            <FaPhoneAlt className="text-xs" /> Request Call
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Wishlist Section */}
        {active === 'wishlist' && (
          <div className="space-y-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-ink">My Wishlist</h2>
              {wishlistItems.length > 0 && <span className="text-sm text-ink-light">{wishlistItems.length} items</span>}
            </div>
            {wishlistItems.length ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {wishlistItems.map((item) => {
                  const product = item.product || {};
                  return (
                    <div key={`${product._id}-${item.variantSku || 'default'}`} className="rounded-3xl border border-gold/20 bg-white p-4 shadow-card flex flex-col">
                      <Link to={`/product/${product._id}`} className="relative block aspect-square overflow-hidden rounded-2xl">
                        {product.images?.length ? (
                          <img
                            src={getImageUrl(product.images, product.name)}
                            alt={product.name}
                            className="h-full w-full object-cover"
                            onError={handleImageError}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                            <span className="text-4xl">👗</span>
                          </div>
                        )}
                      </Link>
                      <div className="mt-3 flex-1 flex flex-col">
                        <Link
                          to={`/product/${product._id}`}
                          className="font-serif text-lg font-bold text-ink hover:text-pink-700 line-clamp-2"
                        >
                          {product.name}
                        </Link>
                        <div className="mt-auto pt-3">
                          <div className="flex gap-2">
                            <button
                              onClick={async () => {
                                try {
                                  await api.post('/cart', { productId: product._id, quantity: 1, variantSku: item.variantSku });
                                  toast.success('Added to cart');
                                } catch { toast.error('Failed to add to cart'); }
                              }}
                              className="flex-1 flex items-center justify-center gap-1.5 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-dark"
                            >
                              <FaShoppingBag className="text-xs" /> Cart
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  await wishlistApi.removeFromWishlist(product._id, item.variantSku);
                                  toast.success('Removed from wishlist');
                                  setWishlistItems((prev) => prev.filter((w) => w.product?._id !== product._id));
                                } catch { toast.error('Failed to remove'); }
                              }}
                              className="flex items-center justify-center rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                            >
                              <FaTrash className="text-xs" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gold/30 bg-cream/60 p-8 text-center">
                <FaHeart className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-3 text-sm text-ink-light">Your wishlist is empty.</p>
                <Link
                  to="/shop"
                  className="mt-3 inline-block rounded-full bg-pink-600 px-6 py-2 text-sm font-semibold text-white hover:bg-pink-700"
                >
                  Browse Shop
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Profile Section */}
        {active === 'profile' && profile !== null && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-gold/20 bg-white p-5 shadow-card sm:p-8">
              <h2 className="text-xl font-bold text-ink mb-6">Profile Information</h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="md:col-span-1 flex flex-col items-center gap-4">
                  <ProfileAvatarUpload
                    user={profileData}
                    onAvatarChange={(newAvatar) => setProfile((prev) => prev ? { ...prev, avatar: newAvatar } : { avatar: newAvatar })}
                    onUserUpdate={(updated) => setEditProfile({ ...editProfile, avatar: updated })}
                  />
                  <div className="text-center">
                    <p className="font-semibold text-ink">{editProfile?.name || profileData?.name || user?.name}</p>
                    <p className="text-sm text-ink-light">{editProfile?.email || profileData?.email || user?.email}</p>
                  </div>
                </div>
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-ink-light">Full Name</label>
                    <input
                      type="text"
                      value={editProfile?.name || ''}
                      onChange={(e) => setEditProfile({ ...editProfile, name: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-ink focus:border-pink-500 focus:ring-1 focus:ring-pink-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-ink-light">Email Address</label>
                    <input
                      type="email"
                      value={editProfile?.email || ''}
                      onChange={(e) => setEditProfile({ ...editProfile, email: e.target.value })}
                      disabled
                      className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-400 focus:border-pink-500 focus:ring-1 focus:ring-pink-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-ink-light">Phone Number</label>
                    <input
                      {...PHONE_INPUT_PROPS}
                      value={editProfile?.phone || ''}
                      onChange={handleProfilePhoneChange}
                      onBlur={handleProfilePhoneBlur}
                      aria-invalid={profilePhoneError}
                      className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-ink focus:border-pink-500 focus:ring-1 focus:ring-pink-200"
                    />
                    {profilePhoneError && (
                      <p className={PHONE_ERROR_CLASS}>{PHONE_ERROR_MESSAGE}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-ink-light">Address</label>
                    <textarea
                      value={editProfile?.address || ''}
                      onChange={(e) => setEditProfile({ ...editProfile, address: e.target.value })}
                      rows={3}
                      className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-ink focus:border-pink-500 focus:ring-1 focus:ring-pink-200"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      disabled={saving}
                      onClick={handleProfileSave}
                      className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
                    >
                      <FaSave className="text-xs" /> {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Password Change */}
            <div className="rounded-3xl border border-gold/20 bg-white p-5 shadow-card sm:p-8">
              <h2 className="text-xl font-bold text-ink mb-6">Change Password</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="text-xs font-semibold text-ink-light">Current Password</label>
                  <input
                    type="password"
                    value={pwd.current}
                    onChange={(e) => setPwd({ ...pwd, current: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-ink focus:border-pink-500 focus:ring-1 focus:ring-pink-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink-light">New Password</label>
                  <input
                    type="password"
                    value={pwd.next}
                    onChange={(e) => setPwd({ ...pwd, next: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-ink focus:border-pink-500 focus:ring-1 focus:ring-pink-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink-light">Confirm New Password</label>
                  <input
                    type="password"
                    value={pwd.confirm}
                    onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-ink focus:border-pink-500 focus:ring-1 focus:ring-pink-200"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  disabled={saving || !pwd.current || !pwd.next || !pwd.confirm}
                  onClick={handlePasswordSave}
                  className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </div>

            <AddressManager user={profile} onUserUpdate={(updated) => setProfile((prev) => prev ? { ...prev, ...updated } : updated)} />

            {/* Order History Summary */}
            <div className="rounded-3xl border border-gold/20 bg-white p-5 shadow-card sm:p-8">
              <h2 className="text-xl font-bold text-ink mb-4">Order History</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{orderSummary.total}</p>
                  <p className="text-xs text-ink-light">Total Orders</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{orderSummary.delivered}</p>
                  <p className="text-xs text-ink-light">Delivered</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-ink">{money(totalSpent)}</p>
                  <p className="text-xs text-ink-light">Total Spent</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-pink-600">{wishlistItems.length}</p>
                  <p className="text-xs text-ink-light">Wishlist</p>
                </div>
              </div>
            </div>

            <DangerZone onDeactivate={() => {}} onDelete={() => {}} />

          </div>
        )}

        {/* Rewards Section */}
        {active === 'rewards' && (
          <RewardsPanel
            loyalty={loyalty}
            referralCode={referralCode}
            onCopyReferral={copyReferral}
            onRedeem={(rewardId) => {
              setActionLoading(rewardId);
              api.post(`/loyalty/redeem/${rewardId}`)
                .then(({ data }) => {
                  toast.success('Reward claimed!');
                  setLoyalty(data.loyalty);
                })
                .catch((err) => toast.error(err.response?.data?.message || 'Failed to claim reward'))
                .finally(() => setActionLoading(null));
            }}
            actionLoading={actionLoading}
          />
        )}
      </div>
    </div>
    <Fragment>
      {cancelOrderId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/40 p-0 sm:items-center sm:p-4">
          <div className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-3xl sm:p-6">
            <h3 className="text-lg font-bold text-ink">Cancel Order</h3>
            <p className="mt-2 text-sm text-gray-600">Are you sure you want to cancel this order? This action cannot be undone.</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Cancellation reason (required)"
              rows={3}
              className="mt-4 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-ink focus:border-pink-500 focus:ring-1 focus:ring-pink-200"
              required
            />
            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                onClick={() => { setCancelOrderId(null); setCancelReason(''); }}
                className="min-h-[44px] rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
              >
                Keep Order
              </button>
              <button
                onClick={() => handleCancelOrder(cancelOrderId)}
                disabled={actionLoading === cancelOrderId || !cancelReason.trim()}
                className="min-h-[44px] rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading === cancelOrderId ? 'Cancelling...' : 'Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}
      {deleteOrderId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/40 p-0 sm:items-center sm:p-4">
          <div className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-3xl sm:p-6">
            <h3 className="text-lg font-bold text-ink">Delete Order</h3>
            <p className="mt-2 text-sm text-gray-600">Are you sure you want to delete this order from your history? This action cannot be undone.</p>
            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                onClick={() => setDeleteOrderId(null)}
                className="min-h-[44px] rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
              >
                Keep Order
              </button>
              <button
                onClick={() => handleDeleteOrder(deleteOrderId)}
                disabled={actionLoading === deleteOrderId}
                className="min-h-[44px] rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading === deleteOrderId ? 'Deleting...' : 'Delete Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Fragment>
  </Fragment>
  );
};

export default Dashboard;


