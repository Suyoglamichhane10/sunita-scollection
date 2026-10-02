import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import api from '../Services/api';
import { useAuth } from './Authcontext';
import { useChat } from './ChatContext';

const EnquiryDataContext = createContext(null);

// Module-level cache so React StrictMode double-mounts (dev) and fast remounts
// reuse a single in-flight request instead of firing one per component.
let cachedEnquiries = null;
let cachedApprovedIds = null;
let inflightEnquiries = null;
let inflightApproved = null;

export const useEnquiryData = () => useContext(EnquiryDataContext);

export const EnquiryDataProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { socketRef } = useChat();
  const [enquiries, setEnquiries] = useState(cachedEnquiries || []);
  const [approvedIds, setApprovedIds] = useState(cachedApprovedIds || []);
  const [loading, setLoading] = useState(!cachedEnquiries && !cachedApprovedIds);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchEnquiries = useCallback(async () => {
    if (inflightEnquiries) return inflightEnquiries;
    inflightEnquiries = (async () => {
      try {
        const { data } = await api.get('/enquiries/my');
        const list = data.enquiries || [];
        cachedEnquiries = list;
        if (mountedRef.current) setEnquiries(list);
      } catch {
        cachedEnquiries = [];
        if (mountedRef.current) setEnquiries([]);
      } finally {
        inflightEnquiries = null;
        if (mountedRef.current) setLoading(false);
      }
    })();
    return inflightEnquiries;
  }, []);

  const fetchApproved = useCallback(async () => {
    if (inflightApproved) return inflightApproved;
    inflightApproved = (async () => {
      try {
        const { data } = await api.get('/enquiries/approved-products');
        const ids = data.productIds || [];
        cachedApprovedIds = ids;
        if (mountedRef.current) setApprovedIds(ids);
      } catch {
        cachedApprovedIds = [];
        if (mountedRef.current) setApprovedIds([]);
      } finally {
        inflightApproved = null;
      }
    })();
    return inflightApproved;
  }, []);

  const refetchAll = useCallback(() => {
    cachedEnquiries = null;
    cachedApprovedIds = null;
    return Promise.all([fetchEnquiries(), fetchApproved()]);
  }, [fetchEnquiries, fetchApproved]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      cachedEnquiries = [];
      cachedApprovedIds = [];
      setEnquiries([]);
      setApprovedIds([]);
      setLoading(false);
      return;
    }
    fetchEnquiries();
    fetchApproved();
  }, [isAuthenticated, authLoading, fetchEnquiries, fetchApproved]);

  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return undefined;

    let debounceRef = null;
    const scheduleRefresh = () => {
      if (debounceRef) clearTimeout(debounceRef);
      debounceRef = setTimeout(() => {
        fetchEnquiries();
        fetchApproved();
      }, 300);
    };

    const events = [
      'enquiry:new',
      'enquiry:reply',
      'enquiry:counter',
      'enquiry:deal_closed',
    ];
    events.forEach((event) => socket.on(event, scheduleRefresh));

    return () => {
      if (debounceRef) clearTimeout(debounceRef);
      events.forEach((event) => socket.off(event, scheduleRefresh));
    };
  }, [socketRef, fetchEnquiries, fetchApproved]);

  const isApproved = useCallback(
    (productId) => approvedIds.includes(productId),
    [approvedIds]
  );

  const getEnquiryForProduct = useCallback(
    (productId) => {
      if (!productId) return null;
      return (
        enquiries.find((e) => e.productId?._id === productId || e.productId === productId) || null
      );
    },
    [enquiries]
  );

  const value = useMemo(
    () => ({
      enquiries,
      approvedIds,
      loading,
      isApproved,
      getEnquiryForProduct,
      refetchEnquiries: fetchEnquiries,
      refreshApproved: fetchApproved,
      refetchAll,
    }),
    [
      enquiries,
      approvedIds,
      loading,
      isApproved,
      getEnquiryForProduct,
      fetchEnquiries,
      fetchApproved,
      refetchAll,
    ]
  );

  return <EnquiryDataContext.Provider value={value}>{children}</EnquiryDataContext.Provider>;
};

export default EnquiryDataContext;
