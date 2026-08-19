# Full Website Payment Integration Prompt

## Project Context
I have a full-stack e-commerce website called "Sunita'z Collection" built with:
- **Frontend**: React.js with Vite, Tailwind CSS, React Router
- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose
- **Current Payment**: Partially integrated Khalti payment gateway

## Current Payment Implementation Status
- Basic Khalti integration exists in `server/src/controllers/paymentController.js`
- Checkout page at `client/src/pages/customer/Checkout.jsx`
- Payment routes at `server/src/Routes/paymentRoutes.js`
- Environment variables configured in `server/.env`
- Documentation available in `docs/KHALTI_PAYMENT_SETUP.md`, `docs/KHALTI_CURRENT_STATUS.md`

## Requirements for Complete Payment Integration

### 1. Payment Gateway Integration
Please implement a complete, production-ready payment system with the following features:

#### A. Multiple Payment Methods
- **Khalti** (already partially integrated - needs completion)
- **eSewa** (Nepal's popular payment gateway)
- **Cash on Delivery (COD)** option
- **Bank Transfer** option (optional)

#### B. Payment Flow
1. User adds products to cart
2. Proceeds to checkout
3. Selects preferred payment method
4. For digital payments (Khalti/eSewa):
   - Redirect to payment gateway
   - Process payment
   - Handle success/failure callbacks
   - Update order status automatically
5. For COD:
   - Confirm order with COD status
   - Send confirmation email/SMS
6. Generate order confirmation with unique order ID

### 2. Backend Implementation Requirements

#### A. Payment Controller (`server/src/controllers/paymentController.js`)
- Complete Khalti integration with proper error handling
- Add eSewa payment gateway integration
- Implement payment verification webhooks
- Handle payment success/failure callbacks
- Create payment record in database
- Update order status based on payment result
- Implement refund functionality (if needed)

#### B. Payment Routes (`server/src/Routes/paymentRoutes.js`)
- POST `/api/payment/khalti/initiate` - Initiate Khalti payment
- POST `/api/payment/khalti/verify` - Verify Khalti payment
- POST `/api/payment/esewa/initiate` - Initiate eSewa payment
- POST `/api/payment/esewa/verify` - Verify eSewa payment
- POST `/api/payment/cod/confirm` - Confirm COD order
- GET `/api/payment/status/:orderId` - Check payment status
- POST `/api/payment/webhook/khalti` - Khalti webhook
- POST `/api/payment/webhook/esewa` - eSewa webhook

#### C. Payment Model (`server/src/Models/Payment.js`) - Create if not exists
```javascript
- orderId (reference to Order)
- userId (reference to User)
- amount (number)
- paymentMethod (enum: 'khalti', 'esewa', 'cod', 'bank_transfer')
- paymentStatus (enum: 'pending', 'completed', 'failed', 'refunded')
- transactionId (unique identifier from payment gateway)
- gatewayResponse (object - store full response)
- paidAt (date)
- createdAt (date)
```

#### D. Order Model Updates (`server/src/Models/Order.js`)
- Add paymentStatus field
- Add paymentMethod field
- Add transactionId field
- Add paymentDetails (object for storing gateway response)

### 3. Frontend Implementation Requirements

#### A. Checkout Page (`client/src/pages/customer/Checkout.jsx`)
- Display order summary with all items
- Show total amount
- Payment method selection (radio buttons/cards):
  - Khalti (with logo)
  - eSewa (with logo)
  - Cash on Delivery
  - Bank Transfer
- Show payment instructions for each method
- "Place Order" button
- Loading state during payment processing
- Error handling and display

#### B. Payment Components
Create reusable components:
- `client/src/components/payment/PaymentMethodSelector.jsx` - Payment method selection UI
- `client/src/components/payment/KhaltiButton.jsx` - Khalti payment button
- `client/src/components/payment/eSewaButton.jsx` - eSewa payment button
- `client/src/components/payment/PaymentStatus.jsx` - Display payment status

#### C. Order Success Page (`client/src/pages/customer/OrderSuccess.jsx`)
- Display order confirmation
- Show order ID
- Show payment method used
- Show transaction ID (if digital payment)
- Display next steps
- Option to download invoice

#### D. Payment Failure Page (`client/src/pages/customer/PaymentFailure.jsx`)
- Show error message
- Display what went wrong
- Option to retry payment
- Option to choose different payment method
- Contact support information

### 4. API Service Updates (`client/src/Services/api.js`)
Add payment API endpoints:
- initiateKhaltiPayment(orderId, amount)
- verifyKhaltiPayment(payload)
- initiateEsewaPayment(orderId, amount)
- verifyEsewaPayment(payload)
- confirmCOD(orderId)
- getPaymentStatus(orderId)

### 5. Environment Variables Required

#### Server (`server/.env`)
```
# Khalti
KHALTI_SECRET_KEY=your_khalti_secret_key
KHALTI_API_URL=https://khalti.com/api/v2
KHALTI_RETURN_URL=http://localhost:5173/payment/khalti/success
KHALTI_CANCEL_URL=http://localhost:5173/payment/khalti/cancel
KHALTI_WEBHOOK_URL=https://yourdomain.com/api/payment/webhook/khalti

# eSewa
ESEWA_MERCHANT_ID=your_esewa_merchant_id
ESEWA_SECRET_KEY=your_esewa_secret_key
ESEWA_API_URL=https://esewa.com.np/api
ESEWA_RETURN_URL=http://localhost:5173/payment/esewa/success
ESEWA_CANCEL_URL=http://localhost:5173/payment/esewa/cancel
ESEWA_WEBHOOK_URL=https://yourdomain.com/api/payment/webhook/esewa

# Payment
PAYMENT_SUCCESS_URL=http://localhost:5173/order-success
PAYMENT_FAILURE_URL=http://localhost:5173/payment-failure
```

### 6. Security Requirements
- Implement proper authentication middleware for all payment routes
- Validate payment amounts on server-side (don't trust client)
- Use HTTPS in production
- Implement CSRF protection
- Sanitize all payment inputs
- Store sensitive credentials securely (use environment variables)
- Implement rate limiting on payment endpoints
- Log all payment transactions for audit trail

### 7. Error Handling
- Handle payment gateway timeouts
- Handle network failures
- Handle insufficient balance scenarios
- Handle duplicate payment attempts
- Provide user-friendly error messages
- Implement retry mechanism for failed payments
- Send email notifications for payment failures

### 8. Testing Requirements
- Test all payment methods in sandbox/test mode
- Test payment success flow
- Test payment failure flow
- Test payment cancellation
- Test webhook handling
- Test concurrent payment attempts
- Test edge cases (network issues, browser close during payment)

### 9. Additional Features
- Send payment confirmation email to user
- Send payment confirmation SMS (if possible)
- Generate PDF invoice
- Payment history in user dashboard
- Admin can view all transactions
- Refund functionality (optional)
- Payment analytics for admin

### 10. Database Schema Updates Needed

#### Payment Collection
```javascript
{
  _id: ObjectId,
  orderId: { type: ObjectId, ref: 'Order', required: true },
  userId: { type: ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  paymentMethod: { 
    type: String, 
    enum: ['khalti', 'esewa', 'cod', 'bank_transfer'],
    required: true 
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  transactionId: { type: String, unique: true },
  gatewayResponse: { type: Object },
  paidAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

## Expected Deliverables

1. **Backend**:
   - Complete payment controller with all payment methods
   - Updated payment routes
   - Payment model (if not exists)
   - Updated order model with payment fields
   - Webhook handlers for payment gateways
   - Email service integration for payment confirmations

2. **Frontend**:
   - Updated checkout page with payment method selection
   - Payment method selector component
   - Payment success page
   - Payment failure page
   - Updated API service with payment endpoints
   - Loading states and error handling
   - Responsive design for mobile payments

3. **Documentation**:
   - Setup instructions for each payment gateway
   - API documentation
   - Testing guide
   - Deployment checklist

4. **Testing**:
   - Test all payment flows
   - Verify webhook handling
   - Test error scenarios
   - Mobile responsiveness testing

## Notes
- Ensure the integration is production-ready with proper error handling
- Follow the existing code structure and patterns in the project
- Use the existing authentication middleware
- Maintain consistency with the current UI/UX design
- Ensure mobile responsiveness for payment pages
- Add proper validation on both frontend and backend
- Implement proper logging for debugging

## Current File Structure Reference
```
server/src/
├── controllers/
│   └── paymentController.js (exists - needs completion)
├── Models/
│   ├── Order.js (exists - needs payment fields)
│   └── Payment.js (may need to be created)
├── Routes/
│   └── paymentRoutes.js (exists - needs updates)
└── services/
    └── emailService.js (exists - can be used for payment confirmations)

client/src/
├── pages/customer/
│   ├── Checkout.jsx (exists - needs payment method integration)
│   ├── OrderSuccess.jsx (exists - may need updates)
│   └── PaymentFailure.jsx (exists - may need updates)
├── Services/
│   └── api.js (exists - needs payment endpoints)
└── components/
    └── payment/ (may need to be created)
```

Please implement a complete, secure, and user-friendly payment integration system following these requirements.