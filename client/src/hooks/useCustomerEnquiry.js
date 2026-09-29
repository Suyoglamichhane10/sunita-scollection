import { useState, useEffect, useCallback } from 'react';
import api from '../Services/api';
import { useAuth } from '../Context/Authcontext';
import { useChat } from '../Context/ChatContext';

const useCustomerEnquiry = (productId) => {
  const { isAuthenticated } = useAuth();
  const { socketRef } = useChat();
  const [enquiry, setEnquiry] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchEnquiry = useCallback(async () => {
    if (!isAuthenticated || !productId) return;
    setLoading(true);
    try {
      const { data } = await api.get('/enquiries/my');
      const found = (data.enquiries || []).find(
        (e) => e.productId?._id === productId || e.productId === productId
      );
      setEnquiry(found || null);
    } catch {
      setEnquiry(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, productId]);

  useEffect(() => {
    fetchEnquiry();
  }, [fetchEnquiry]);

  useEffect(() => {
    if (!socketRef?.current) return;
    const socket = socketRef.current;
    const handler = () => {
      fetchEnquiry();
    };
    socket.on('enquiry:reply', handler);
    socket.on('enquiry:new', handler);
    socket.on('enquiry:counter', handler);
    socket.on('enquiry:deal_closed', handler);
    return () => {
      socket.off('enquiry:reply', handler);
      socket.off('enquiry:new', handler);
      socket.off('enquiry:counter', handler);
      socket.off('enquiry:deal_closed', handler);
    };
  }, [socketRef, fetchEnquiry]);

  return { enquiry, loading, refetch: fetchEnquiry };
};

export default useCustomerEnquiry;