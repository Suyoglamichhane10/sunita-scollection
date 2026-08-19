# Payment Gateway Testing Guide (eSewa + Khalti)

This guide covers configuring and testing **eSewa** and **Khalti** payments for
Sunita'z Collection in both **test (RC)** and **live (production)** environments.

---

## 1. Environment Variables

Copy `server/.env.example` to `server/.env` and set the values.

### eSewa

| Variable | Test (RC) | Live |
|----------|-----------|------|
| `ESEWA_ENV` | `test` | `production` (leave unset) |
| `ESEWA_PRODUCT_CODE` | `EPAYTEST` | your real eSewa merchant product code |
| `ESEWA_SECRET_KEY` | eSewa RC secret: **`8gBm/:&EnhH.1/q`** | your live eSewa secret key |

Auto-selected endpoints based on `ESEWA_ENV`:
- **Test (RC):**
  - Form URL: `https://rc-epay.esewa.com.np/api/epay/main/v2/form`
  - Status URL: `https://rc.esewa.com.np/api/epay/transaction/status/`
- **Live:**
  - Form URL: `https://epay.esewa.com.np/api/epay/main/v2/form`
  - Status URL: `https://epay.esewa.com.np/api/epay/transaction/status/`

> **Why Es104 happens:** eSewa's v2 API requires a valid HMAC-SHA256 signature in
> **all** environments, including RC. The signature is a base64 HMAC of
> `total_amount=<total>,transaction_uuid=<uuid>,product_code=<code>` using the
> merchant secret key. If the key is missing/wrong, eSewa returns
> `{"code":"Es104","message":"Invalid payload signature."}`. Our code now always
> computes the signature — just make sure `ESEWA_SECRET_KEY` is set correctly.

### Khalti

| Variable | Test (dev) | Live |
|----------|-----------|------|
| `KHALTI_ENV` | `test` | `production` (leave unset) |
| `KHALTI_SECRET_KEY` | your **test** secret key (from Khalti dashboard → Keys) | your **live** secret key |

Auto-selected endpoints based on `KHALTI_ENV`:
- **Test (dev):** `https://dev.khalti.com/api/v2`
- **Live:** `http://khalti.com/api/v2`

> Khalti API v2 requires a `customer_info` object (`name`, `email`, `phone`) in
> the initiate payload. Our code populates it from the logged-in user. Amounts are
> in **paisa** (`totalAmount * 100`).

---

## 2. eSewa RC (Test) Credentials

- Merchant code: `EPAYTEST`
- Secret key: `8gBm/:&EnhH.1/q`
- RC payment page: `https://rc-epay.esewa.com.np/#/home`
- To complete an RC payment you need a **test eSewa account**. eSewa issues test
  credentials to registered RC merchants. Contact eSewa merchant support to get
  RC login details (a test wallet with a small balance).

**RC test flow:**
1. Register/apply for eSewa RC merchant access to obtain RC wallet credentials.
2. Log in at `https://rc-epay.esewa.com.np/#/home`.
3. Run the payment from your app → you are redirected to the RC gateway.
4. Select "Test..." / your test wallet and confirm.
5. You return to `/order-success/:orderId`, verification runs server-side, order
   becomes `confirmed`, stock decrements, confirmation email is sent.

---

## 3. Khalti Test Credentials

1. Create a Khalti merchant account at `https://khalti.com/` (or the dashboard).
2. In the Khalti dashboard, go to **Settings → Keys** (or Dashboard → Developers).
3. Copy the **Test Secret Key** (format: `test_secret_...`).
4. Set `KHALTI_SECRET_KEY` and `KHALTI_ENV=test`.

**Khalti test flow:**
1. Initiate a Khalti payment from your app.
2. You are redirected to the Khalti test gateway.
3. Choose a test payment method (eWallet/test card) or use the sandbox.
4. After completing, you return to `/order-success/:orderId` with a `pidx` query
   param → server verifies via `/epayment/lookup/` → order confirmed.

---

## 4. End-to-End Test Checklist

Run this after configuring `.env`:

- [ ] **Order creation (eSewa):** checkout → select eSewa → Place Order.
  The browser is redirected to the eSewa gateway form (no Es104).
- [ ] **Order creation (Khalti):** checkout → select Khalti → Place Order.
  The browser is redirected to the Khalti payment page.
- [ ] **Cancelled payment:** cancel on the gateway → you land on
  `/payment-failure/:orderId`. Order `paymentStatus=failed`, `orderStatus=cancelled`.
- [ ] **Successful eSewa:** complete payment → `/order-success/:orderId`.
  Order → `paymentStatus=paid`, `orderStatus=confirmed`, `isPaid=true`,
  `paymentDetails.transactionId` populated. Stock decreased once.
- [ ] **Successful Khalti:** complete payment → same result.
- [ ] **Confirmation email:** received at the customer's email after verification.
- [ ] **Stock:** product stock decremented only after verified payment (not at
  order creation) for eSewa/Khalti.
- [ ] **Idempotency:** refreshing `/order-success/:orderId` does not decrement
  stock again (guarded by the double-callback check).
- [ ] **Auth:** an unauthenticated gateway redirect to verify works (public
  callback endpoints) while initiate endpoints still require a logged-in user.

### Manual API tests (after placing an order, get a JWT via /auth/login)

```bash
# eSewa initiate
curl -X POST http://localhost:5000/api/payments/esewa/initiate \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"orderId":"<ORDER_ID>"}'

# Khalti initiate
curl -X POST http://localhost:5000/api/payments/khalti/initiate \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"orderId":"<ORDER_ID>"}'

# Payment status (protected)
curl http://localhost:5000/api/payments/status/<ORDER_ID> \
  -H "Authorization: Bearer $TOKEN"
```

---

## 5. Troubleshooting

| Symptom | Cause / Fix |
|---------|-------------|
| eSewa `Es104 Invalid payload signature` | `ESEWA_SECRET_KEY` missing/wrong. Set the correct key (RC: `8gBm/:&EnhH.1/q`). |
| Khalti initiate fails | Missing `customer_info` (now fixed). Verify `KHALTI_SECRET_KEY` is the test/live key matching `KHALTI_ENV`. |
| Order stuck `pending` | Payment never verified. Complete the gateway flow; check server logs for verify errors. |
| No confirmation email | `EMAIL_USER`/`EMAIL_PASS` not configured or SMTP blocked. Use a Gmail App Password. |
| Verification timeout (504) | eSewa/Khalti status API slow/unreachable. Retry; ensure server can reach gateway endpoints (no firewall block). |
| Amount mismatch on verify | Shipping/tax changed after initiate. Amounts are read from the order, which is stable. |

---

## 6. Stripe (card payments)

Stripe orders are finalized **only via the signed webhook** (never by trusting a
browser return URL). The webhook endpoint is `POST /api/payments/stripe/webhook`
and it is mounted with a raw body parser in `app.js` so `constructEvent` can
verify the signature.

### Setup
1. Create a Stripe account and grab your **test secret key** → `STRIPE_SECRET_KEY`.
2. In the Stripe dashboard add a webhook endpoint pointing to
   `https://<your-api>/api/payments/stripe/webhook` with the event
   `checkout.session.completed`.
3. Copy the endpoint's **signing secret** (`whsec_...`) → `STRIPE_WEBHOOK_SECRET`.

### Test flow
1. Checkout → select **Card (Stripe)** → Place Order. The order is created with
   `paymentStatus=pending` and you are redirected to Stripe Checkout (test mode).
2. Pay with Stripe's test card `4242 4242 4242 4242`, any future expiry, any CVC.
3. Stripe sends `checkout.session.completed` to the webhook → order becomes
   `paymentStatus=paid`, `orderStatus=confirmed`, stock decremented, email sent.
4. You return to `/order-success/:orderId?gateway=stripe`. The page polls the
   order until the webhook has finalized it (up to ~15s) and then shows success.

> **Important:** Do NOT mark a Stripe order as paid based on the browser redirect.
> Only the webhook event is authoritative. If the webhook is not configured, the
> order will stay `pending`.

## 7. Going to Production

1. **eSewa:** Contact eSewa to get live merchant credentials (product code +
   secret). Set `ESEWA_ENV=` (unset/`production`) and update both keys.
2. **Khalti:** Buy/subscribe a live Khalti gateway, copy the **live secret key**,
   set `KHALTI_ENV=` (unset/`production`).
3. **Stripe:** Switch `STRIPE_SECRET_KEY` to your live key and point the webhook
   to your production domain with the live `STRIPE_WEBHOOK_SECRET`.
4. Set `FRONTEND_URL` to your real frontend domain (used for success/failure URLs).
5. Ensure `success_url` / `failure_url` / `return_url` use HTTPS in production.
6. Test a small real payment for each gateway before going fully live.
7. Keep eSewa secret key, Khalti secret key, and Stripe secret/webhook keys
   **server-side only** — never expose them to the frontend.

