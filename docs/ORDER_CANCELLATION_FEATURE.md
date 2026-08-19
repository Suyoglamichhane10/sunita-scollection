# Order Cancellation Feature

## Overview
Customers can now cancel their orders directly from the "My Orders" page. This feature allows customers to cancel orders that are in 'pending' or 'confirmed' status, with automatic stock restoration.

## Features Implemented

### 1. Backend API Endpoint
**Endpoint:** `PUT /api/orders/:id/cancel`  
**Access:** Private/Customer (authenticated users only)  
**Controller:** `cancelOrder` in `orderController.js`

### 2. Business Logic
- **Eligibility:** Only orders with 'pending' or 'confirmed' status can be cancelled
- **Authorization:** Customers can only cancel their own orders
- **Stock Restoration:** Automatically restores product stock when an order is cancelled
- **Status History:** Records the cancellation in the order's status history
- **Real-time Updates:** Emits socket event for live order tracking updates

### 3. Frontend UI
- **Cancel Button:** Appears only for cancellable orders (pending/confirmed)
- **Confirmation Dialog:** Asks for confirmation before cancelling
- **Loading State:** Shows "Cancelling..." text during the API call
- **Success/Error Messages:** Provides feedback to the user
- **Disabled State:** Button is disabled during the cancellation process

## Files Modified

### Backend
1. **`server/src/controllers/orderController.js`**
   - Added `cancelOrder` function (lines 377-437)
   - Validates order ownership
   - Checks if order is cancellable
   - Restores stock using `restoreStock` service
   - Updates order status to 'cancelled'
   - Emits socket event for real-time updates

2. **`server/src/Routes/orderRoutes.js`**
   - Imported `cancelOrder` controller
   - Added route: `router.put('/:id/cancel', protect, cancelOrder)`

### Frontend
3. **`client/src/pages/customer/Orders.jsx`**
   - Imported `FaTimes` icon
   - Added `cancellingOrderId` state to track cancellation in progress
   - Created `handleCancelOrder` function to handle the cancellation API call
   - Added cancel button UI that only shows for pending/confirmed orders
   - Button shows loading state and disables during cancellation
   - Shows success/error alerts to the user

## How It Works

### Cancellation Flow
1. Customer navigates to "My Orders" page
2. System displays all orders with their current status
3. For orders with 'pending' or 'confirmed' status, a "Cancel Order" button is displayed
4. Customer clicks the "Cancel Order" button
5. Confirmation dialog appears: "Are you sure you want to cancel this order? This action cannot be undone."
6. If confirmed:
   - Button shows "Cancelling..." and becomes disabled
   - API call is made to `PUT /api/orders/:id/cancel`
   - Backend validates:
     - Order exists
     - Order belongs to the customer
     - Order is in a cancellable state
   - Backend performs:
     - Updates order status to 'cancelled'
     - Adds entry to status history
     - Restores stock for all items in the order
     - Emits socket event for real-time updates
   - Frontend receives success response
   - Order is updated in the local state
   - Success message is displayed
7. If error occurs:
   - Error message is displayed
   - Button is re-enabled

### Stock Restoration
When an order is cancelled, the system automatically restores stock:
- For products with variants: Restores variant-specific stock
- For products without variants: Restores general product stock
- Uses atomic operations to prevent race conditions

### Status Timeline
Cancelled orders display a special message instead of the normal timeline:
```
This order was cancelled.
```

## Security & Validation

### Backend Validations
1. **Authentication:** User must be logged in (protected route)
2. **Authorization:** User can only cancel their own orders
3. **Status Check:** Only 'pending' or 'confirmed' orders can be cancelled
4. **Error Handling:** Proper error messages for various failure scenarios

### Frontend Validations
1. **Confirmation Dialog:** Prevents accidental cancellations
2. **Loading State:** Prevents duplicate cancellation requests
3. **Conditional Rendering:** Button only shows when appropriate

## Error Handling

### Possible Errors
1. **Order Not Found:** Returns 404 if order doesn't exist
2. **Unauthorized:** Returns 403 if user tries to cancel another user's order
3. **Invalid Status:** Returns 400 if order is not in a cancellable state
4. **Server Error:** Returns 500 for unexpected errors

### User Feedback
- Success: "Order cancelled successfully. Stock has been restored."
- Error: Displays specific error message from the server

## Testing

### Test Cases
1. **Cancel Pending Order:**
   - Create an order with 'pending' status
   - Navigate to My Orders
   - Click "Cancel Order"
   - Confirm cancellation
   - Verify order status changes to 'cancelled'
   - Verify stock is restored

2. **Cancel Confirmed Order:**
   - Create an order with 'confirmed' status
   - Navigate to My Orders
   - Click "Cancel Order"
   - Confirm cancellation
   - Verify order status changes to 'cancelled'
   - Verify stock is restored

3. **Try to Cancel Non-cancellable Order:**
   - Navigate to an order with 'processing', 'shipped', or 'delivered' status
   - Verify "Cancel Order" button is not displayed

4. **Try to Cancel Another User's Order:**
   - Attempt to cancel an order that doesn't belong to the logged-in user
   - Verify error message: "Unauthorized to cancel this order"

5. **Cancel Already Cancelled Order:**
   - Try to cancel an order that is already cancelled
   - Verify error message indicating the order cannot be cancelled

## API Response Examples

### Success Response
```json
{
  "success": true,
  "order": {
    "_id": "order_id",
    "orderStatus": "cancelled",
    "statusHistory": [
      {
        "status": "pending",
        "note": "Order created",
        "updatedBy": "user_id",
        "timestamp": "2024-01-01T00:00:00.000Z"
      },
      {
        "status": "cancelled",
        "note": "Order cancelled by customer",
        "updatedBy": "user_id",
        "timestamp": "2024-01-02T00:00:00.000Z"
      }
    ]
  },
  "message": "Order cancelled successfully"
}
```

### Error Response (Invalid Status)
```json
{
  "success": false,
  "message": "Cannot cancel order with status: processing. Only pending or confirmed orders can be cancelled."
}
```

### Error Response (Unauthorized)
```json
{
  "success": false,
  "message": "Unauthorized to cancel this order"
}
```

## Future Enhancements

1. **Partial Cancellation:** Allow cancelling specific items from an order
2. **Cancellation Reason:** Add a field to capture why the customer is cancelling
3. **Refund Integration:** Automatically process refunds for paid orders
4. **Email Notification:** Send cancellation confirmation email to customer
5. **Time Limit:** Add a time window (e.g., 24 hours) within which orders can be cancelled
6. **Admin Notification:** Notify admin when an order is cancelled
7. **Analytics:** Track cancellation reasons and patterns

## Notes

- Cancelled orders are excluded from revenue calculations in the admin dashboard
- The order remains in the database for record-keeping purposes
- Stock restoration uses the same `restoreStock` service used elsewhere in the application
- Socket events ensure real-time updates if the customer has the order tracking page open