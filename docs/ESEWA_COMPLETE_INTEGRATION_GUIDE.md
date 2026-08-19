# Complete eSewa Payment Integration Guide

## Overview
This guide provides complete instructions for the eSewa payment integration with OTP verification flow for Sunita'z Collection e-commerce website.

## Test Credentials
- **Merchant ID**: EPAYTEST
- **Secret Key**: 8gBm/:&EnhH.1/q
- **Test Phone Number**: 9800000000
- **Test MPIN/Password**: 123456
- **Test OTP**: 1111

## Implementation Summary

### Backend Files Modified/Created:
1. **server/.env** - eSewa credentials configured
2. **server/src/config/esewa.js** - eSewa configuration module (URL fixed)
3. **server/src/controllers/paymentController.js** - Added esewaSuccess, esewaFailure, getEsewaStatus functions
4. **server/src/Routes/paymentRoutes.js** - Added new eSewa routes
5. **server/src/Models/Payment.js** - Created Payment model
6. **server/src/Models/Order.js** - Already has payment fields

### Frontend Files Modified:
1. **client/src/pages/customer/Checkout.jsx** - eSewa payment handling (already exists)
2. **client/src/pages/customer/OrderSuccess.jsx** - Shows transaction ID
3. **client/src/pages/customer/PaymentFailure.jsx** - Enhanced error messages

## API Endpoints

### Public Endpoints (No Authentication Required)
- `GET /api/payments/esewa/success` - eSewa success callback
- `GET /api/payments/esewa/failure` - eSewa failure callback
- `POST /api/payments/esewa/verify` - Verify eSewa payment
- `POST /api/payments/khalti/verify` - Verify Khalti payment
- `POST /api/payments/stripe/webhook` - Stripe webhook

### Protected Endpoints (Authentication Required)
- `POST /api/payments/esewa/initiate` - Initiate eSewa payment
- `GET /api/payments/esewa/status/:transactionId` - Check eSewa payment status
- `POST /api/payments/khalti/initiate` - Initiate Khalti payment
- `GET /api/payments/status/:orderId` - Get payment status

## Payment Flow

### eSewa Payment Flow:
1. User selects eSewa during checkout
2. User clicks "Place Order"
3. Backend creates order in database
4. Backend initiates eSewa payment and returns payment URL with parameters
5. Frontend submits form to eSewa gateway
6. User enters eSewa credentials on eSewa page:
   - Username/Phone: 9800000000
   - MPIN/Password: 123456
   - OTP: 1111
7. eSewa redirects to success or failure URL
8. Backend verifies payment with eSewa API
9. Order status updated to "confirmed" and payment status to "paid"
10. User redirected to Order Success page with transaction ID

## Testing Instructions

### Prerequisites:
1. Ensure MongoDB is running
2. Ensure server is running on port 5000
3. Ensure client is running on port 5173
4. Verify .env file has correct eSewa credentials

### Step-by-Step Testing:

#### 1. Start the Application
```bash
# Terminal 1 - Start MongoDB (if not running)
mongod

# Terminal 2 - Start Server
cd server
npm run dev

# Terminal 3 - Start Client
cd client
npm run dev
```

#### 2. Test eSewa Payment Flow
1. **Login** to the application at http://localhost:5173
2. **Add products** to cart
3. **Go to Checkout** page
4. **Fill shipping details**
5. **Select eSewa** as payment method
6. **Click "Place Order"**
7. **You will be redirected** to eSewa test environment (https://rc-epay.esewa.com.np)
8. **Enter test credentials**:
   - Username: `9800000000`
   - Password: `123456`
   - OTP: `1111`
9. **Complete payment**
10. **You will be redirected** back to Order Success page
11. **Verify**:
    - Order number is displayed
    - Total amount is shown
    - Payment method shows "ESEWA"
    - Payment status shows "Paid"
    - Transaction ID is displayed

#### 3. Test Payment Failure Flow
1. Follow steps 1-6 above
2. On eSewa page, **cancel the payment** or enter wrong OTP
3. **You will be redirected** to Payment Failure page
4. **Verify**:
    - Error message is displayed
    - Order details are shown
    - "Retry Payment" button works
    - "Back to Checkout" button works

#### 4. Test Payment Status API
```bash
# Get order ID from your test order, then:
curl -X GET http://localhost:5000/api/payments/esewa/status/{transactionId} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Common Errors and Solutions

### "Invalid User" Error
**Solution**: Use phone number `9800000000` (not the username)

### "Invalid Password" Error
**Solution**: Use MPIN `123456`

### "Invalid OTP" Error
**Solution**: Use OTP `1111`

### "Merchant Not Found" Error
**Solution**: Verify Merchant ID is `EPAYTEST` in .env file

### "Invalid Signature" Error
**Solution**: Verify Secret Key is `8gBm/:&EnhH.1/q` in .env file

### "Payment Failed" Error
**Solution**: Check test account balance or verify all credentials are correct

### "Order not found" Error
**Solution**: Ensure order was created successfully before initiating payment

## Production Deployment Checklist

### 1. Get Real eSewa Credentials
- Register at https://esewa.com.np/#/merchant
- Complete merchant verification
- Get your Merchant ID and Secret Key from eSewa dashboard

### 2. Update Environment Variables
Update `server/.env` file:
```env
# Change from test to live
ESEWA_ENV=live
ESEWA_TEST_MODE=false

# Update with real credentials
ESEWA_MERCHANT_ID=your_real_merchant_id
ESEWA_SECRET_KEY=your_real_secret_key

# Update API URLs to production
ESEWA_API_URL=https://epay.esewa.com.np/api/epay/main/v2/form
ESEWA_STATUS_URL=https://epay.esewa.com.np/api/epay/transaction/status/
ESEWA_VERIFY_URL=https://epay.esewa.com.np/api/epay/transaction/status/

# Update success/failure URLs to production domain
ESEWA_SUCCESS_URL=https://yourdomain.com/order-success
ESEWA_FAILURE_URL=https://yourdomain.com/payment-failure

# Update frontend URL
FRONTEND_URL=https://yourdomain.com
```

### 3. Enable HTTPS/SSL
- Obtain SSL certificate for your domain
- Configure your web server (Nginx/Apache) to use HTTPS
- Update all URLs to use `https://`

### 4. Update CORS Settings
In `server/src/app.js`, ensure your production domain is in the allowed origins:
```javascript
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
```

### 5. Test Production Integration
1. Test with small amount first (Rs. 10-100)
2. Verify payment completion
3. Check order status updates correctly
4. Verify email notifications are sent
5. Test failure scenarios

### 6. Monitor and Log
- Monitor payment success/failure rates
- Log all payment transactions
- Set up alerts for payment failures
- Review eSewa transaction reports regularly

## Security Considerations

1. **Never commit .env file** to version control
2. **Use strong JWT secret** in production
3. **Enable HTTPS** for all payment-related endpoints
4. **Verify webhook signatures** (already implemented for Stripe)
5. **Implement rate limiting** (already implemented)
6. **Log all payment attempts** for audit trail
7. **Validate all inputs** on both frontend and backend
8. **Use environment variables** for all sensitive data

## Dependencies

### Backend Dependencies (Already Installed)
- `crypto` - Built-in Node.js module (no installation needed)
- `express` - Web framework
- `mongoose` - Database ODM
- `dotenv` - Environment variables

### No Additional Packages Required
The integration uses:
- Native Node.js `crypto` module for HMAC-SHA256 signing
- Native `fetch` API for HTTP requests
- No additional packages needed

## File Structure

```
server/
├── .env
├── src/
│   ├── config/
│   │   └── esewa.js
│   ├── controllers/
│   │   └── paymentController.js
│   ├── Models/
│   │   ├── Order.js
│   │   └── Payment.js
│   ├── Routes/
│   │   └── paymentRoutes.js
│   ├── services/
│   │   └── orderFinalizeService.js
│   └── app.js

client/
└── src/
    └── pages/
        └── customer/
            ├── Checkout.jsx
            ├── OrderSuccess.jsx
            └── PaymentFailure.jsx
```

## Troubleshooting

### Server-side Issues:
1. Check server logs for errors
2. Verify .env file is loaded correctly
3. Test eSewa API connectivity
4. Check MongoDB connection
5. Verify JWT token is valid

### Client-side Issues:
1. Check browser console for errors
2. Verify API endpoints are correct
3. Check network tab for failed requests
4. Ensure JWT token is stored correctly
5. Verify form submission to eSewa

### Payment Issues:
1. Verify eSewa credentials are correct
2. Check transaction UUID is unique
3. Verify signature is generated correctly
4. Check amount calculation (no decimals)
5. Verify success/failure URLs are accessible

## Support and Documentation

- eSewa Developer Documentation: https://developer.esewa.com.np/
- eSewa Test Environment: https://rc-epay.esewa.com.np/
- eSewa Merchant Registration: https://esewa.com.np/#/merchant

## Notes

1. **Test Mode**: Always test thoroughly in test environment before going live
2. **Amount**: eSewa does not accept decimal amounts (use Math.round())
3. **Transaction UUID**: Must be unique for each payment attempt
4. **Signature**: Generated using HMAC-SHA256 with sorted parameters
5. **Callback URLs**: Must be publicly accessible for production
6. **Order Status**: Only updates to "confirmed" after successful payment verification

## Success Criteria

The integration is successful when:
- ✅ User can select eSewa as payment method
- ✅ Order is created in database
- ✅ User is redirected to eSewa payment page
- ✅ User can login with test credentials (9800000000/123456)
- ✅ User can enter OTP (1111) and complete payment
- ✅ User is redirected back to success page
- ✅ Order status updates to "confirmed"
- ✅ Payment status updates to "paid"
- ✅ Transaction ID is stored and displayed
- ✅ Failure scenarios are handled gracefully
- ✅ Error messages are user-friendly