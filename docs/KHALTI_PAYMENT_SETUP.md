# Khalti Payment Gateway Integration Guide

## Overview
This guide provides complete instructions for setting up and testing the Khalti payment gateway integration for Sunita'z Collection e-commerce platform.

## Current Implementation Status ✅

The Khalti payment integration is **already implemented** in the codebase with:
- Payment initiation endpoint (`POST /api/payments/khalti/initiate`)
- Payment verification endpoint (`POST /api/payments/khalti/verify`)
- Frontend checkout handling in `Checkout.jsx`
- Order model support for Khalti transactions
- Stock decrement after payment confirmation
- Order status updates to "confirmed" after successful payment

## What You Need to Do

### Step 1: Get Your Khalti Secret Key

1. **Visit Khalti Merchant Dashboard**
   - Go to: https://merchant.khalti.com/
   - Log in with your Khalti merchant account

2. **Navigate to API Keys**
   - Click on **Settings** (gear icon)
   - Select **API Keys** from the menu
   - You'll see two keys:
     - **Test Secret Key** (for testing)
     - **Live Secret Key** (for production)

3. **Copy the Test Secret Key**
   - It's a **32-character hexadecimal string** (e.g., `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)
   - Copy this key carefully

### Step 2: Configure the Secret Key

1. **Open the `.env` file** in the `server/` directory

2. **Replace the placeholder** with your actual test secret key:
   ```env
   KHALTI_SECRET_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
   ```

3. **Save the file**

4. **Restart the server** for changes to take effect:
   ```bash
   # Stop the current server (Ctrl+C)
   # Then restart it
   npm run dev
   # or
   npm start
   ```

### Step 3: Verify Configuration

The server will validate your key on startup. If the key is invalid, you'll see an error message like:
```
Khalti is not configured on the server. KHALTI_SECRET_KEY is missing or invalid
```

## Testing the Integration

### Test Environment Details

**Test URL:** `https://a.khalti.com/api/v2/epayment/initiate/`

**Test Phone Numbers:**
- `9800000000` - Test user 1
- `9800000001` - Test user 2
- `9800000002` - Test user 3

**Test PIN:** `111111` (6-digit PIN for all test accounts)

### Testing Steps

1. **Start the Application**
   ```bash
   # Terminal 1: Start backend
   cd server
   npm run dev
   
   # Terminal 2: Start frontend
   cd client
   npm run dev
   ```

2. **Add Products to Cart**
   - Browse products on the homepage
   - Add items to your cart
   - Proceed to checkout

3. **Select Khalti Payment**
   - On the checkout page, select **"Khalti"** as payment method
   - Fill in shipping details
   - Click "Place Order"

4. **Complete Payment on Khalti**
   - You'll be redirected to Khalti's test payment page
   - Use test phone number: `9800000000`
   - Enter test PIN: `111111`
   - Click "Confirm Payment"

5. **Verify Success**
   - You'll be redirected back to the order success page
   - Order status should be "confirmed"
   - Stock should be decremented
   - You'll see a success message

### Test Different Scenarios

#### Test Payment Failure
1. During Khalti payment, enter wrong PIN: `000000`
2. Payment will fail
3. Order status will be "cancelled"
4. Stock will NOT be decremented
5. You'll be redirected to payment failure page

#### Test Payment Cancellation
1. During Khalti payment, click "Cancel"
2. Order will remain in "pending" status
3. Stock will NOT be decremented

## Switching to Production (Live Mode)

### When You're Ready to Go Live

1. **Get Live Secret Key**
   - Log in to https://merchant.khalti.com/
   - Go to Settings > API Keys
   - Copy the **Live Secret Key**

2. **Update `.env` File**
   ```env
   # Change from test to live
   KHALTI_ENV=live
   KHALTI_SECRET_KEY=your_live_secret_key_here
   KHALTI_BASE_URL=https://khalti.com/api/v2
   ```

3. **Update Frontend URL** (if needed)
   ```env
   FRONTEND_URL=https://yourdomain.com
   ```

4. **Restart the Server**
   ```bash
   npm run dev
   # or
   npm start
   ```

5. **Test with Real Payment**
   - Use a real Khalti account
   - Make a small test transaction
   - Verify the payment completes successfully

## API Endpoints

### 1. Initiate Khalti Payment
```
POST /api/payments/khalti/initiate
Headers: Authorization: Bearer <jwt_token>
Body: {
  "orderId": "order_id_here"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "paymentUrl": "https://a.khalti.com/api/v2/epayment/initiate/...",
    "pidx": "unique_payment_id"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Error message here"
}
```

### 2. Verify Khalti Payment
```
POST /api/payments/khalti/verify
Headers: Authorization: Bearer <jwt_token>
Body: {
  "orderId": "order_id_here",
  "pidx": "payment_id_from_initiation"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "order": {
    "_id": "order_id",
    "orderStatus": "confirmed",
    "isPaid": true,
    "paymentStatus": "paid",
    "paymentDetails": {
      "transactionId": "khalti_transaction_id",
      "paymentId": "pidx",
      "paymentDate": "2025-10-08T...",
      "gateway": "khalti"
    }
  }
}
```

## How It Works

### Payment Flow

```
1. Customer places order → Order created with status "pending"
2. Customer selects Khalti → Redirected to Khalti payment page
3. Customer completes payment on Khalti → Khalti redirects back to success page
4. Frontend calls verify endpoint → Backend verifies with Khalti API
5. Payment confirmed → Order status updated to "confirmed", stock decremented
6. Customer sees success page with order details
```

### Key Features

✅ **Secure Payment**: Uses Khalti's official API with secret key authentication  
✅ **Amount Validation**: Verifies payment amount matches order total  
✅ **Stock Management**: Stock is only decremented after successful payment  
✅ **Order Confirmation**: Order status updates to "confirmed" only after verification  
✅ **Error Handling**: Proper error messages for invalid keys, timeouts, and failures  
✅ **Double Payment Protection**: Prevents duplicate payment processing  
✅ **Test Environment**: Safe testing with test credentials before going live  

## Troubleshooting

### Issue: "Khalti is not configured on the server"
**Solution:** 
- Check that `KHALTI_SECRET_KEY` is set in `.env`
- Ensure the key is a 32-character hex string
- Restart the server after making changes

### Issue: "Authentication credentials were not provided"
**Solution:**
- Your secret key is invalid or placeholder
- Get the correct key from Khalti merchant dashboard
- Update `.env` and restart server

### Issue: Payment page not loading
**Solution:**
- Check internet connectivity
- Verify `KHALTI_BASE_URL` is correct
- Check browser console for errors

### Issue: Payment verification fails
**Solution:**
- Ensure you're using the correct test environment
- Check that `pidx` is being passed correctly
- Verify the order exists and belongs to the user

### Issue: Stock not decrementing
**Solution:**
- Stock only decrements after successful payment verification
- Check that `finalizePaidOrder` is being called
- Verify order status is "confirmed" after payment

## Environment Variables Reference

```env
# Khalti Configuration
KHALTI_SECRET_KEY=your_32_character_hex_key_here
KHALTI_ENV=test                    # or 'live' for production
KHALTI_BASE_URL=https://a.khalti.com/api/v2  # test URL
# KHALTI_BASE_URL=https://khalti.com/api/v2   # live URL

# Frontend URL (for redirects)
FRONTEND_URL=http://localhost:5173  # or your production URL
```

## Security Notes

⚠️ **Important Security Practices:**

1. **Never commit `.env` to version control**
   - Add `.env` to `.gitignore`
   - Only commit `.env.example` with placeholder values

2. **Use environment variables**
   - Never hardcode secret keys in code
   - Use different keys for test and production

3. **Rotate keys regularly**
   - Change secret keys periodically
   - Immediately rotate if compromised

4. **Validate all payments server-side**
   - Never trust frontend payment status
   - Always verify with Khalti API before confirming

5. **Use HTTPS in production**
   - Never process payments over HTTP
   - Ensure SSL certificate is valid

## Support and Documentation

- **Khalti Merchant Dashboard:** https://merchant.khalti.com/
- **Khalti API Documentation:** https://docs.khalti.com/
- **Khalti Support:** support@khalti.com
- **Test Credentials:** Available in Khalti merchant dashboard under "Test Environment"

## Next Steps

1. ✅ Get your test secret key from Khalti
2. ✅ Update `server/.env` with the key
3. ✅ Restart the server
4. ✅ Test the payment flow with test credentials
5. ✅ Verify order confirmation and stock decrement
6. ✅ Test payment failure scenarios
7. ✅ When ready, switch to live mode with live secret key

## Quick Reference

| Item | Test Environment | Live Environment |
|------|-----------------|------------------|
| Base URL | `https://a.khalti.com/api/v2` | `https://khalti.com/api/v2` |
| Environment Variable | `KHALTI_ENV=test` | `KHALTI_ENV=live` |
| Phone Number | `9800000000` | Real phone number |
| PIN | `111111` | Real Khalti PIN |
| Secret Key | Test key from dashboard | Live key from dashboard |

---

**Need Help?** Check the server logs for detailed error messages. The integration includes comprehensive error handling and logging to help diagnose issues quickly.