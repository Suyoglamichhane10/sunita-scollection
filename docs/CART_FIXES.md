# Cart / Order Quantity Duplication Fix

This document explains the cart & order duplication bug, the fixes applied, how
to debug whether the issue is on the backend, frontend, or both, and how to
verify the fixes with test scenarios.

## Root Cause

The most common cause observed in this app is that **variants created in the
admin catalog without a SKU** break the product+variant matching used by the
cart. When a customer buys an item, the cart/order logic cannot reliably tell
two rows apart (or fails to match an existing row), so it creates **duplicate
cart entries / inflated quantities** for what is really a single purchase.

The issue can also be caused by:

1. The cart not properly merging the same product+variant (appending a new row
   instead of updating the existing quantity).
2. The add-to-cart flow not checking whether the product+variant combination
   already exists.
3. Order creation not consolidating duplicate line items before computing
   totals.
4. The cart total / item count being calculated from duplicate entries.
5. The database not updating existing cart items in place.
6. Frontend state not syncing with the backend cart.
7. The variant ID not being checked consistently (SKU vs `_id`).
8. Guest→login cart merge duplicating items instead of consolidating them.

## Files Changed

| File | What changed |
|------|--------------|
| `client/src/pages/admin/AdminCatalog.jsx` | Auto-generate a unique SKU for every variant when none is provided (both in the builder and the advanced JSON editor). This guarantees variants are always identifiable by a stable SKU. |
| `client/src/Context/CartContext.jsx` | Added `consolidateCartItems()` to merge duplicate product+variant rows; made `addToCart` variant-aware and optimistic (bump quantity if the combination already exists); consolidated guest→server merge and server responses; normalized variant SKU handling. |
| `server/src/controllers/userController.js` | The actual cart controller. Added `consolidateCart()` and `cartItemHas()` helpers; `addToCart`, `getCart`, and `updateCartItem` now consolidate duplicates and validate positive-integer quantities. |
| `server/src/controllers/orderController.js` | `createOrder` now consolidates incoming line items by product+variant and validates quantities before building the order, so the order summary is correct. |

> Note: There is **no `cartController.js`** in this codebase. The cart logic
> lives in `server/src/controllers/userController.js`. If you were asked to
> edit `cartController.js`, that file does not exist here — the equivalent
> handlers live in `userController.js`.

## Debugging: Is It Backend, Frontend, or Both?

### 1. Check the raw backend data (MongoDB)

Query the user's `cart` array directly. Look for duplicate rows with the same
`product` + `variantSku`.

```js
// In a Node/mongoose shell or Mongo shell:
db.users.find({ email: 'customer@example.com' }, { cart: 1 }).pretty();
```

- If you see **duplicate rows** with the same `product` + `variantSku`, the
  data itself is duplicated → backend/database issue (or legacy data).
- If rows look clean but the UI still shows too many, the issue is frontend.

### 2. Hit the cart API directly (skip the frontend)

Log in and capture your token, then:

```bash
# Get cart
curl -H "Authorization: Bearer <TOKEN>" http://localhost:5000/api/users/profile/cart

# Add the same product+variant twice
curl -X POST -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{"productId":"<PID>","quantity":1,"variantSku":"<SKU>"}' \
  http://localhost:5000/api/users/profile/cart
curl -X POST -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{"productId":"<PID>","quantity":1,"variantSku":"<SKU>"}' \
  http://localhost:5000/api/users/profile/cart
```

- After the two POSTs, `quantity` should be **2** in a single row — not two
  separate rows of 1. If it is two rows, the backend is the problem.
- If the backend is correct but the UI still shows duplicates, the frontend
  state is the problem.

### 3. Check frontend state (browser)

Open DevTools → Application → Local Storage and inspect `guest_cart` (for
guests). Also log `cartItems` in the Cart page. If the array has duplicate
`key`s, the frontend is not consolidating.

### 4. Check the order creation

Place an order and inspect the returned `order.items`. Each item should appear
once with the correct `quantity` and `total = price * quantity`. Duplicate
`items` entries indicate the order path is not consolidating.

## Test Scenarios

### Scenario 1 — Add the same product+variant twice (no variants)
1. Log in as a customer.
2. Add a product (base, no variant) with quantity 1.
3. Add the same product again with quantity 1.
4. **Expected:** One cart row with `quantity = 2`. Total items = 2. Total price
   = `price * 2`. Order summary shows quantity 2 for that product.

### Scenario 2 — Add different variants of the same product
1. Create a product with two variants (e.g. Red and Blue) in the admin catalog.
   Do **not** type a SKU for either — the system should auto-generate one.
2. Add Red (qty 1) and Blue (qty 1).
3. **Expected:** Two separate cart rows (one per variant), each quantity 1.
   Total items = 2. This confirms variants are NOT merged with each other.

### Scenario 3 — Add the same variant twice
1. Using the product above, add Red (qty 1) twice.
2. **Expected:** One Red row with `quantity = 2`. Total items = 2.

### Scenario 4 — Guest → login merge
1. As a guest, add product A (qty 1) and product A again (qty 1).
2. Log in.
3. **Expected:** The guest cart is consolidated into the server cart as a
   single row for product A with `quantity = 2` — no duplicates.

### Scenario 5 — Order summary quantities
1. Add product A (qty 2) and product B (qty 3).
2. Checkout.
3. **Expected:** Order items show A with quantity 2 and B with quantity 3.
   Subtotal = `(A.price * 2) + (B.price * 3)`. No duplicate line items.

### Scenario 6 — Stock capping
1. Add a product with stock 1.
2. Add it twice.
3. **Expected:** Quantity is capped at the available stock (1), not 2.

### Scenario 7 — Quantity validation
1. Try to add a product with `quantity: 0` or `quantity: -1` via the API.
2. **Expected:** 400 error: "Quantity must be a positive integer".

## Verification Notes

- After editing backend files, restart the backend server.
- After editing frontend files, the Vite dev server will hot-reload.
- If you previously had duplicate rows, the new `getCart` consolidation will
  clean them up on the next cart fetch.
