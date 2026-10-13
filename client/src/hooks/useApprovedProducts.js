import { useCallback } from 'react';
import { useEnquiryData } from '../Context/EnquiryDataContext';

export const useApprovedProducts = () => {
  const { approvedIds, loading, isApproved, getEnquiryForProduct, refetchAll } = useEnquiryData();

  const refreshApproved = useCallback(() => {
    if (refetchAll) refetchAll();
  }, [refetchAll]);

  return {
    approvedIds,
    isApproved,
    getEnquiryForProduct,
    loading,
    refreshApproved,
  };
};
