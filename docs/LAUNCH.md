# Production launch guide

## Recommended budget-friendly architecture

Use Vercel for `client/`, Render for `server/`, MongoDB Atlas for the database, and Cloudinary for product images. These managed services already provide HTTPS, reverse proxying, process restarts, and basic logs; use the included Docker, Nginx, and PM2 files only when you later move to a VPS.

## 1. Secure the source repository

1. Confirm `server/.env` is not staged with `git status`.
2. Create a private GitHub repository and commit the application, `.gitignore`, `.github/workflows/ci.yml`, and environment examples only.
3. Enable GitHub secret scanning, Dependabot alerts, and branch protection requiring the CI checks.
4. Generate a unique `JWT_SECRET` using a password manager. Never reuse development secrets.

## 2. Set up managed services

1. Create a MongoDB Atlas production cluster and database user limited to this database. In Network Access, allow only the backend host addresses where possible.
2. Create a Cloudinary production environment and copy its cloud name, API key, and secret to backend environment variables.
3. Add the deployed frontend domain as `FRONTEND_URL`; use comma-separated domains only when necessary, for example the production domain plus a preview domain.
4. On Render, create a Web Service from `server/`, use `npm ci` to build and `npm start` to run, select Node 20, and configure a health check at `/api/health`.
5. On Vercel, set the root directory to `client`, build command to `npm run build`, output directory to `dist`, and `VITE_API_URL` to `https://api.example.com/api`.
6. Configure an SPA rewrite in Vercel: `/(.*)` to `/index.html`.

Required backend variables: `NODE_ENV=production`, `PORT`, `FRONTEND_URL`, `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRE`, `CLOUDINARY_*`, `EMAIL_*`, and only the payment credentials you have activated. Set `SEED_ADMIN=false` after the initial administrator is created.

## 3. Payment go-live checklist

1. Keep Cash on Delivery available while wallet/card payment access is being approved.
2. Obtain eSewa merchant production credentials and set `ESEWA_URL`, `ESEWA_PRODUCT_CODE`, `ESEWA_SECRET_KEY`, and `ESEWA_STATUS_URL` to their production values. Test successful, cancelled, duplicate, and pending transactions.
3. Obtain Khalti production access, set `KHALTI_SECRET_KEY` and `KHALTI_BASE_URL=https://khalti.com/api/v2`, then test the server-side initiation and lookup flow. The secret must never be sent to the frontend.
4. Configure Stripe test keys first. Verify Stripe only via signed webhooks, not by trusting a browser return URL; do not claim a Stripe order is paid until webhook verification is implemented and tested.
5. Reconcile every paid order with the provider dashboard before launch. Refund/cancellation flows need a manual operating procedure before automated refunds are enabled.

## 4. Test before each release

Run locally:

```powershell
cd client; npm run lint; npm run build
cd ../server; npm test
```

Manual E2E checks: register, login/logout, guest-to-account cart merge, product variant pricing and stock, address save, COD checkout, each payment sandbox redirect/callback, order status updates, admin-only routes, product upload, messages, mobile layout, and expired-session handling.

Before launch run Lighthouse on home/shop/product/checkout (mobile and desktop), test current Chrome/Firefox/Edge/Safari, and use a tool such as k6 against public catalogue endpoints. Start with low traffic; do not load-test payment endpoints or third-party gateways.

## 5. Security and operations

- CORS uses `FRONTEND_URL`; set it to exact HTTPS origins only. Do not use `*` with credentials.
- The app now refuses an in-memory MongoDB in production. Treat startup failures as incidents.
- Rate limiting is global plus stricter on authentication. Tune limits after observing legitimate traffic.
- Store secrets only in provider environment-variable dashboards. Rotate a key immediately if it appears in Git, a screenshot, logs, or chat.
- Add Sentry and structured request logging before accepting real payments. Alert on 5xx rate, payment verification failures, failed logins, and database disconnects.
- Back up Atlas and Cloudinary assets; practise restoring a backup.

## 6. VPS-only option

Use `docker compose up --build` for a local/VPS container stack. On a VPS, terminate TLS in a managed load balancer or a separately configured HTTPS Nginx host, keep MongoDB private, run the API with PM2 using `server/ecosystem.config.cjs`, and restrict firewall access to ports 80/443. Do not expose MongoDB port 27017 publicly.

## Final launch gate

- [ ] CI passes from a clean clone.
- [ ] No `.env`, uploads, logs, or dependencies are tracked.
- [ ] Production database backup and restore verified.
- [ ] CORS/domain/HTTPS configured.
- [ ] All payment providers passed sandbox and merchant acceptance checks.
- [ ] Stripe webhook verification added before Stripe is enabled.
- [ ] Error tracking, logs, uptime check, and on-call contact are configured.
- [ ] Privacy policy, return/refund policy, contact details, and terms are live.
- [ ] SEO metadata, social image, sitemap/robots, accessibility, and mobile checks completed.
