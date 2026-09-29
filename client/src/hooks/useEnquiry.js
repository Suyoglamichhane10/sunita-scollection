import { useContext } from 'react';
import { EnquiryContext } from '../Context/EnquiryContext';

const useEnquiry = () => {
  const context = useContext(EnquiryContext);

  if (!context) {
    throw new Error('useEnquiry must be used within an EnquiryProvider');
  }

  return context;
};

export default useEnquiry;
