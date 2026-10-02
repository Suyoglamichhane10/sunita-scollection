import { useCallback } from 'react';
import { useEnquiryData } from '../Context/EnquiryDataContext';

export const useApprovedProducts = () => {
  const { approvedIds, loading, isApproved, refetchAll } = useEnquiryData();

  const refreshApproved = useCallback(() => {
    if (refetchAll) refetchAll();
  }, [refetchAll]);

  return {
    approvedIds,
    isApproved,
    loading,
    refreshApproved,
  };
};
