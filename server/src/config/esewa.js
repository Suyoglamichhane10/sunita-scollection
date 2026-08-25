require('dotenv').config();

const getEsewaConfig = () => {
  const isLive = process.env.ESEWA_ENV !== 'test';
  
  return {
    // Merchant credentials
    merchantId: process.env.ESEWA_MERCHANT_ID || 'EPAYTEST',
    secretKey: process.env.ESEWA_SECRET_KEY || '',
    
    // Environment
    isLive,
    env: isLive ? 'live' : 'test',
    
    // API URLs
    apiUrl: process.env.ESEWA_API_URL || (isLive 
      ? 'https://epay.esewa.com.np/api/epay/main/v2/form'
      : 'https://rc-epay.esewa.com.np/api/epay/main/v2/form'),
    verifyUrl: process.env.ESEWA_VERIFY_URL || process.env.ESEWA_STATUS_URL || (isLive
      ? 'https://epay.esewa.com.np/api/epay/transaction/status/'
      : 'https://rc.esewa.com.np/api/epay/transaction/status/'),
    
    // Success/Failure URLs
    successUrl: process.env.ESEWA_SUCCESS_URL || 'http://localhost:5173/order-success',
    failureUrl: process.env.ESEWA_FAILURE_URL || 'http://localhost:5173/payment-failure',
    
    // Product code (usually same as merchant ID for eSewa)
    productCode: process.env.ESEWA_PRODUCT_CODE || process.env.ESEWA_MERCHANT_ID || 'EPAYTEST',
    
    // Test user credentials (for reference during development)
    testCredentials: {
      phone: '9800000000',
      password: '123456',
      pin: '1111',
      otp: '1111'
    }
  };
};

module.exports = { getEsewaConfig };