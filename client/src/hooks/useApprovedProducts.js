import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../Context/Authcontext';
import api from '../Services/api';
import { useChat } from '../Context/ChatContext';

export const useApprovedProducts = () => {
  const [approvedIds, setApprovedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { socketRef } = useChat();
  const approvedIdsRef = useRef(approvedIds);
  const fetchTimeoutRef = useRef(null);
  approvedIdsRef.current = approvedIds;

  const fetchApproved = useCallback(async () => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    fetchTimeoutRef.current = setTimeout(async () => {
      try {
        const { data } = await api.get('/enquiries/approved-products');
        setApprovedIds(data.productIds || []);
      } catch {
        setApprovedIds([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setApprovedIds([]);
      setLoading(false);
      return;
    }
    fetchApproved();
  }, [isAuthenticated, authLoading, fetchApproved]);

  useEffect(() => {
    if (!socketRef?.current) return;
    const socket = socketRef.current;
    const handler = () => {
      fetchApproved();
    };
    socket.on('enquiry:new', handler);
    socket.on('enquiry:deal_closed', handler);
    socket.on('enquiry:reply', handler);
    return () => {
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
      socket.off('enquiry:new', handler);
      socket.off('enquiry:deal_closed', handler);
      socket.off('enquiry:reply', handler);
    };
  }, [socketRef, fetchApproved]);

  const isApproved = useCallback(
    (productId) => approvedIds.includes(productId),
    [approvedIds]
  );

  const refreshApproved = fetchApproved;

  return { approvedIds, isApproved, loading, refreshApproved };
};