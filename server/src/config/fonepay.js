require('dotenv').config();

const getFonepayConfig = () => {
  const isLive = process.env.FONEPAY_ENV !== 'test';
  
  return {
    merchantId: process.env.FONEPAY_MERCHANT_ID || '',
    merchantSecret: process.env.FONEPAY_MERCHANT_SECRET || '',
    appId: process.env.FONEPAY_APP_ID || '',
    isLive,
    env: isLive ? 'live' : 'test',
    baseUrl: process.env.FONEPAY_BASE_URL || (isLive
      ? 'https://api.fonepay.com/api/merchant/'
      : 'https://dev.fonepay.com/api/merchant/'),
    productCode: process.env.FONEPAY_PRODUCT_CODE || 'PRODUCT_CODE',
    successUrl: process.env.FONEPAY_SUCCESS_URL || 'http://localhost:5173/payment-success',
    failureUrl: process.env.FONEPAY_FAILURE_URL || 'http://localhost:5173/payment-failure',
    redirectUrl: process.env.FONEPAY_REDIRECT_URL || 'http://localhost:5173/payment/callback',
  };
};

module.exports = { getFonepayConfig };
