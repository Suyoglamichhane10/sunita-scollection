import React, { createContext, useState, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './Authcontext';
import toast from 'react-hot-toast';

export const EnquiryContext = createContext();

export const useEnquiry = () => useContext(EnquiryContext);

export const EnquiryProvider = ({ children }) => {
  const [product, setProduct] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const openEnquiry = useCallback(
    (productData) => {
      if (!isAuthenticated) {
        toast(
          <span className="flex items-center gap-2">
            <span className="text-lg">🔔</span>
            Please login to enquire about this product.
          </span>,
          { duration: 4000, icon: '🔒' }
        );

        const destination = `/product/${productData._id}?enquire=1`;
        const currentPath = window.location.pathname + window.location.search;
        navigate(`/login?redirect=${encodeURIComponent(destination)}`, {
          state: { from: currentPath },
        });
        return;
      }

      setProduct(productData || null);
      setIsOpen(true);
    },
    [isAuthenticated, navigate]
  );

  const closeEnquiry = useCallback(() => {
    setIsOpen(false);
    setProduct(null);
  }, []);

  const value = {
    product,
    isOpen,
    openEnquiry,
    closeEnquiry,
    setProduct,
    setIsOpen,
  };

  return <EnquiryContext.Provider value={value}>{children}</EnquiryContext.Provider>;
};

export default EnquiryContext;
