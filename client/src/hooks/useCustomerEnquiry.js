import { useCallback, useMemo } from 'react';
import { useEnquiryData } from '../Context/EnquiryDataContext';

const useCustomerEnquiry = (productId) => {
  const { getEnquiryForProduct, refetchEnquiries } = useEnquiryData();

  const enquiry = useMemo(
    () => getEnquiryForProduct(productId),
    [getEnquiryForProduct, productId]
  );

  const refetch = useCallback(() => {
    if (refetchEnquiries) refetchEnquiries();
  }, [refetchEnquiries]);

  return { enquiry, loading: false, refetch };
};

export default useCustomerEnquiry;
