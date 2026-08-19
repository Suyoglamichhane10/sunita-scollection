# eSewa Payment Integration - Complete Testing Guide

## Overview
This guide provides step-by-step instructions to test the eSewa payment integration for Sunita'z Collection e-commerce website.

## Prerequisites
- Backend server running on `http://localhost:5000`
- Frontend server running on `http://localhost:5173`
- MongoDB database connected
- User account created on the website

## Test Credentials

### eSewa Test Account
- **Phone Number**: 9800000000
- **Password/MPIN**: 123456
- **OTP**: 1111

### Merchant Configuration
- **Merchant ID**: EPAYTEST
- **Product Code**: EPAYTEST
- **Secret Key**: 8gBm/:&EnhH.1/q
- **Environment**: Test (Sandbox)

## Configuration Verification

### 1. Verify server/.env file
```env
ESEWA_MERCHANT_ID=EPAYTEST
ESEWA_PRODUCT_CODE=EPAYTEST
ESEWA_SECRET_KEY=8gBm/:&EnhH.1/q
ESEWA_ENV=test
ESEWA_TEST_MODE=true
ESEWA_URL=https://rc-epay.esewa.com.np/api/epay/main/v2/form
ESEWA_STATUS_URL=https://rc.esewa.com.np/api/epay/transaction/status/
ESEWA_API_URL=https://rc-epay.esewa.com.np/api/epay/main/v2/form
ESEWA_VERIFY_URL=https://rc.esewa.com.np/api/epay/transaction/status/
ESEWA_SUCCESS_URL=http://localhost:5173/order-success
ESEWA_FAILURE_URL=http://localhost:5173/payment-failure
```

### 2. Verify server/src/config/esewa.js
- Should import from `../config/esewa`
- Should use `getEsewaConfig()` function
- Should have correct test credentials in config

### 3. Verify server/src/controllers/paymentController.js
- Should import `getEsewaConfig` from config file
- Should NOT have duplicate `getEsewaConfig` function
- Should use centralized config for all eSewa operations

## Step-by-Step Testing

### Step 1: Start the Application

#### Terminal 1 - Start Backend
```bash
cd server
npm run dev
```
Expected output: `Server running on port 5000`

#### Terminal 2 - Start Frontend
```bash
cd client
npm run dev
```
Expected output: `Local: http://localhost:5173/`

### Step 2: Create Test User (if not exists)
1. Go to `http://localhost:5173/register`
2. Fill in registration details
3. Complete registration
4. Login with credentials

### Step 3: Add Products to Cart
1. Go to `http://localhost:5173/shop`
2. Browse products (Trendy Tops, Dresses, Bottoms, Footwear, Accessories)
3. Add items to cart
4. Verify cart total updates correctly

### Step 4: Initiate Checkout with eSewa

1. **Navigate to Checkout**
   - Click cart icon
   - Click "Proceed to Checkout"
   - URL: `http://localhost:5173/checkout`

2. **Fill Shipping Address**
   ```
   Full Name: Test User
   Phone Number: 98XXXXXXXX
   Street Address: Your Street
   City: Kathmandu
   State: Bagmati
   Country: Nepal
   ```

3. **Select Payment Method**
   - Click on "eSewa" payment method
   - Should see green "ESEWA" badge selected

4. **Place Order**
   - Click "Place Order" button
   - Should see "Processing..." briefly
   - Should redirect to eSewa payment page

### Step 5: eSewa Payment Gateway

1. **eSewa Login Page**
   - URL: `https://rc-epay.esewa.com.np/`
   - Should see eSewa login form

2. **Enter Test Credentials**
   ```
   Username/Phone: 9800000000
   Password: 123456
   ```

3. **OTP Verification**
   - After login, OTP screen appears
   - Enter OTP: `1111`
   - Click "Verify OTP"

4. **Confirm Payment**
   - Review payment details
   - Should show:
     - Merchant: EPAYTEST
     - Amount: [Your order total]
     - Transaction ID: [Generated UUID]
   - Click "Pay Now" or "Confirm Payment"

### Step 6: Payment Success Flow

1. **Redirect to Success Page**
   - Should redirect to: `http://localhost:5173/order-success/[orderId]`
   - Should see green checkmark icon
   - Should see "Payment Successful!" heading

2. **Verify Order Details**
   - Order number should display (format: ORD-YYMMDD-XXXX)
   - Total amount should match cart total
   - Payment method: ESEWA
   - Payment status: Paid (green)
   - Delivery estimate: 3-5 business days

3. **Verify Cart Cleared**
   - Cart should be empty
   - Cart count should show 0

### Step 7: Backend Verification

#### Check Order in Database
```javascript
// Use MongoDB Compass or mongosh
db.orders.find({ orderNumber: "ORD-XXXX-XXXX" }).pretty()
```

Expected fields:
```json
{
  "orderNumber": "ORD-260811-1234",
  "paymentMethod": "esewa",
  "paymentStatus": "paid",
  "orderStatus": "confirmed",
  "isPaid": true,
  "paidAt": "2026-11-08T...",
  "paymentDetails": {
    "transactionId": "ref_...",
    "paymentId": "ORD-260811-1234-173...",
    "paymentDate": "2026-11-08T...",
    "gateway": "esewa"
  },
  "statusHistory": [
    {
      "status": "pending",
      "note": "Order created"
    },
    {
      "status": "confirmed",
      "note": "Payment verified via esewa; order confirmed"
    }
  ]
}
```

#### Check Server Logs
```bash
# Backend terminal should show:
✓ POST /api/orders - 201 (Order created)
✓ POST /api/payments/esewa/initiate - 200 (Payment initiated)
✓ POST /api/payments/esewa/verify - 200 (Payment verified)
✓ Order finalized successfully
```

### Step 8: Verify Email Notification
- Check email inbox for order confirmation
- Should contain:
  - Order number
  - Order details
  - Payment confirmation
  - Delivery estimate

## Common Issues and Solutions

### Issue 1: "Invalid User" Error
**Cause**: Wrong credentials entered
**Solution**: 
- Use phone: `9800000000`
- Use password: `123456`
- Ensure no extra spaces

### Issue 2: "Invalid Password" Error
**Cause**: Incorrect password
**Solution**: Use password: `123456`

### Issue 3: "Invalid OTP" Error
**Cause**: Wrong OTP entered
**Solution**: Use OTP: `1111`

### Issue 4: "Merchant Not Found" Error
**Cause**: Wrong Merchant ID in configuration
**Solution**: 
- Verify `ESEWA_MERCHANT_ID=EPAYTEST` in .env
- Restart server after changes

### Issue 5: "Invalid Signature" Error
**Cause**: Wrong Secret Key or signature generation issue
**Solution**:
- Verify `ESEWA_SECRET_KEY=8gBm/:&EnhH.1/q` in .env
- Ensure payment controller uses centralized config
- Check that signature is base64 encoded

### Issue 6: "Payment Failed" or Timeout
**Cause**: Network issues or eSewa service down
**Solution**:
- Check internet connection
- Verify eSewa test environment is operational
- Check server logs for detailed error

### Issue 7: Order Not Updating After Payment
**Cause**: Callback not reaching verify endpoint
**Solution**:
- Check success URL in .env matches actual route
- Verify OrderSuccess.jsx is calling verify endpoint
- Check browser console for errors

### Issue 8: "Order not found" on Success Page
**Cause**: Order ID not passed correctly in URL
**Solution**:
- Verify success URL format: `/order-success/:orderId`
- Check that orderId is in URL parameters
- Ensure order was created before payment initiation

## Testing Checklist

### Pre-Testing
- [ ] Backend server running on port 5000
- [ ] Frontend server running on port 5173
- [ ] MongoDB connected
- [ ] Test user account created
- [ ] Products available in shop
- [ ] .env file has correct eSewa credentials
- [ ] eSewa config file updated
- [ ] Payment controller using centralized config

### During Testing
- [ ] Cart adds products correctly
- [ ] Checkout page loads
- [ ] Shipping address form works
- [ ] eSewa payment method selectable
- [ ] Order created successfully
- [ ] Redirected to eSewa gateway
- [ ] eSewa login page loads
- [ ] Test credentials work (9800000000 / 123456)
- [ ] OTP verification works (1111)
- [ ] Payment confirmation page shows correct amount
- [ ] Payment processes successfully
- [ ] Redirected to success page
- [ ] Order details display correctly
- [ ] Cart cleared after successful payment

### Post-Testing Verification
- [ ] Order status = "confirmed" in database
- [ ] Payment status = "paid" in database
- [ ] isPaid = true in database
- [ ] paymentDetails populated with transaction ID
- [ ] statusHistory shows payment confirmation
- [ ] Confirmation email received
- [ ] Stock decremented for ordered items
- [ ] No duplicate orders created
- [ ] No duplicate payment verifications

## API Endpoint Testing

### 1. Test Order Creation
```bash
POST http://localhost:5000/api/orders
Headers: Authorization: Bearer [token]
Body: {
  "items": [{"productId": "...", "quantity": 1}],
  "shippingAddress": {...},
  "paymentMethod": "esewa"
}
```
Expected: 201 Created with order details

### 2. Test eSewa Payment Initiation
```bash
POST http://localhost:5000/api/payments/esewa/initiate
Headers: Authorization: Bearer [token]
Body: {"orderId": "..."}
```
Expected: 200 OK with paymentUrl and params

### 3. Test eSewa Payment Verification
```bash
POST http://localhost:5000/api/payments/esewa/verify
Body: {
  "orderId": "...",
  "transactionUuid": "...",
  "refId": "..."
}
```
Expected: 200 OK with success message and updated order

### 4. Test Payment Status
```bash
GET http://localhost:5000/api/payments/status/[orderId]
Headers: Authorization: Bearer [token]
```
Expected: 200 OK with payment status details

## Production Deployment Checklist

### Before Going Live

1. **Update Environment Variables**
   ```env
   ESEWA_ENV=live
   ESEWA_TEST_MODE=false
   ESEWA_MERCHANT_ID=[Your actual merchant ID]
   ESEWA_PRODUCT_CODE=[Your actual product code]
   ESEWA_SECRET_KEY=[Your actual secret key]
   ESEWA_URL=https://epay.esewa.com.np/api/epay/main/v2/form
   ESEWA_STATUS_URL=https://epay.esewa.com.np/api/epay/transaction/status/
   ESEWA_SUCCESS_URL=https://yourdomain.com/order-success
   ESEWA_FAILURE_URL=https://yourdomain.com/payment-failure
   ```

2. **Get Production Credentials from eSewa**
   - Register at https://merchant.esewa.com.np/
   - Complete business verification
   - Receive production Merchant ID and Secret Key
   - Update .env with production credentials

3. **Update Frontend URLs**
   - Update success/failure URLs to production domain
   - Test with production eSewa credentials

4. **Security Checks**
   - [ ] Secret key not exposed in client-side code
   - [ ] HTTPS enabled for production
   - [ ] Environment variables properly secured
   - [ ] API endpoints protected with authentication
   - [ ] Signature verification working correctly

5. **Testing**
   - [ ] Test with small amount first
   - [ ] Verify real payment processing
   - [ ] Check email notifications
   - [ ] Verify order status updates
   - [ ] Test failure scenarios
   - [ ] Monitor transaction logs

6. **Monitoring**
   - [ ] Set up error logging
   - [ ] Monitor payment success rate
   - [ ] Track failed transactions
   - [ ] Set up alerts for payment failures

## Expected Results

### Successful Payment Flow
1. ✅ User selects eSewa payment
2. ✅ Order created with status "pending"
3. ✅ Redirected to eSewa gateway
4. ✅ Login with test credentials works
5. ✅ OTP verification successful
6. ✅ Payment confirmed by eSewa
7. ✅ Redirected to success page
8. ✅ Order status updated to "confirmed"
9. ✅ Payment status updated to "paid"
10. ✅ Cart cleared
11. ✅ Confirmation email sent
12. ✅ Stock decremented

### Error Handling
1. ✅ Invalid credentials show appropriate error
2. ✅ Wrong OTP shows error
3. ✅ Payment cancellation handled gracefully
4. ✅ Network timeouts handled
5. ✅ Duplicate callbacks prevented
6. ✅ Failed payments marked correctly

## Support and Troubleshooting

### Debug Mode
Enable debug logging by adding to .env:
```env
DEBUG=esewa:*
```

### Check Logs
```bash
# Backend logs
tail -f server/logs/app.log

# MongoDB logs
tail -f /var/log/mongodb/mongod.log
```

### Common Debug Steps
1. Check browser console for frontend errors
2. Check backend terminal for API errors
3. Verify network requests in browser DevTools
4. Check MongoDB for order status
5. Verify eSewa transaction in eSewa merchant dashboard

## Contact Support

If issues persist:
1. Check eSewa API documentation: https://developer.esewa.com.np/
2. Verify test environment status
3. Contact eSewa support for merchant account issues
4. Review server logs for detailed error messages

## Success Criteria

The integration is working correctly if:
- ✅ Test credentials (9800000000 / 123456 / 1111) work
- ✅ Payment completes successfully
- ✅ Order status updates automatically
- ✅ Success page shows correct order details
- ✅ No errors in console or logs
- ✅ Email confirmation received
- ✅ Stock updated correctly