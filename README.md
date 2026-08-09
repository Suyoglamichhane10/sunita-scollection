# Sunita's Collection

A complete, production-ready **MERN e-commerce** platform for a **women's fashion and accessories** store — selling **Sarees, Bags, Sandals, Earrings, and Necklaces**.

> **Tagline:** *Elegance for Every Woman*

This full-stack application solves the real business problems of a small fashion store (currently selling only on TikTok): manual order management, scattered messages across platforms, and no centralized inventory tracking.

---

## ✨ Features

### Customer Experience
- **Home** — hero section, category showcase, featured products, features, testimonials, newsletter
- **Shop** — category filters, price-range filter, keyword search, and sorting (newest, price, rating, popular)
- **Product Detail** — multiple images with thumbnails, description, price, stock availability, and **variants** (colors/sizes with their own images, prices, and stock)
- **Cart** — variant-aware add/update/remove with real-time subtotal, tax, shipping, and total
- **Checkout** — shipping form, payment methods (**Cash on Delivery, eSewa, Khalti, Stripe**), order summary
- **Order Success** — order number, payment status, delivery estimate, tracking number
- **My Orders** — full order list with **status timeline** (Pending → Confirmed → Processing → Packed → Shipped → Delivered / Cancelled) and delivery tracking
- **Profile** — edit details, change password, and manage saved addresses
- **Wishlist** — save favorite products
- **Messages** — unified inbox for inquiries with replies
- **Auth** — register, login with password toggle + **remember me**, JWT sessions, forgot/reset password

### Admin Panel
- **Dashboard** — sales, orders, customers, products, revenue, recent orders, low-stock alerts
- **Products** — create/edit/delete products with multiple images and **variant editor**
- **Categories** — add/edit/delete categories with images and ordering
- **Inventory** — stock levels, low-stock alerts, stock updates (base + variants)
- **Orders** — view with full status workflow, tracking number, payment updates
- **Customers** — view all registered customers
- **Messages** — unified inbox consolidating TikTok/WhatsApp/Facebook/website messages with real-time replies
- **Reports & Analytics** — revenue charts (daily/weekly/monthly), best sellers, customer analytics, period comparison

### Payments
- **Cash on Delivery** (default)
- **eSewa** — initiate + verify
- **Khalti** — initiate + verify
- **Stripe** — checkout session

### Delivery
- Kathmandu Valley + nationwide
- Free shipping on orders **above Rs. 1,000**, otherwise **Rs. 100**
- Estimated delivery **3–5 business days**
- Tracking number + status updates

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (Vite), Tailwind CSS, React Router, Axios, Chart.js, Socket.io-client, React Icons, Framer Motion |
| Backend | Node.js, Express, Socket.IO |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcrypt |
| Payments | Stripe, eSewa, Khalti |
| Email | Nodemailer |
| Images | Cloudinary + Multer |
| Security | helmet, CORS, compression, express-rate-limit, express-validator |

---

## 📁 Project Structure

```
sunitas-collection/
├── client/                     # React frontend (Vite)
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/common/  # Navbar, Footer
│   │   ├── Context/            # AuthContext, CartContext
│   │   ├── Layouts/            # CustomerLayout, AdminLayout
│   │   ├── pages/
│   │   │   ├── auth/           # Login, Register, Forgot/Reset password
│   │   │   ├── customer/       # Home, Shop, ProductDetail, Cart, Checkout, Orders, OrderSuccess, Profile, Wishlist, Messages
│   │   │   └── admin/          # Dashboard, Catalog, Inventory, Categories, Orders, Messages, Users, Reports
│   │   ├── Routes/             # AppRoutes
│   │   ├── Services/           # api (axios), socket
│   │   └── index.css
│   ├── .env.example
│   ├── tailwind.config.js
│   └── vite.config.js
│
└── server/                     # Node/Express backend
    ├── src/
    │   ├── config/             # database, cloudinary
    │   ├── controllers/        # auth, product, category, order, user, message, review, payment, upload, analytics
    │   ├── middleware/         # auth, errorHandler, validator
    │   ├── models/             # User, Product, Category, Order, Review, Message
    │   ├── routes/             # auth, product, category, order, user, message, review, payment, upload, analytics
    │   ├── services/           # emailService
    │   ├── sockets/            # Socket.IO real-time
    │   ├── Utils/              # apiResponse, seedAdmin, seedData
    │   ├── app.js
    │   └── server.js
    ├── uploads/                # temporary local uploads before Cloudinary
    └── .env.example
```

---

## 🚀 Quick Start (Development)

For deployment, payment go-live, security, and release checks, see [the production launch guide](docs/LAUNCH.md).

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- A Cloudinary account
- (Optional) Stripe / eSewa / Khalti test keys

### 1. Backend

```bash
cd server
cp .env.example .env
# Fill in MONGO_URI, JWT_SECRET, CLOUDINARY_*, EMAIL_* etc.
npm install
npm run dev
```

The server runs on `http://localhost:5000`.

### 2. Frontend

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

The client runs on `http://localhost:5173` and proxies `/api` requests to the backend (see `vite.config.js`).

### 3. Seed Data (optional)

```bash
cd server
node src/Utils/seedData.js    # creates categories + products with variants
node src/Utils/seedAdmin.js   # create admin account
```

Set `SEED_ADMIN=true` in `.env` to auto-create an admin on server start.

---

## 🔑 Environment Variables

### Server (`server/.env`)
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/sunitas_collection
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30
FRONTEND_URL=http://localhost:5173
SEED_ADMIN=true

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Payments
STRIPE_SECRET_KEY=...
ESEWA_PRODUCT_CODE=...
ESEWA_SECRET_KEY=...
ESEWA_URL=https://rc-epay.esewa.com.np/api/epay/main/v2/form
KHALTI_SECRET_KEY=...

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=you@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM="Sunita's Collection <you@gmail.com>"
```

### Client (`client/.env`)
```env
VITE_API_URL=/api
# Optional publishable keys
VITE_STRIPE_PUBLISHABLE_KEY=...
VITE_ESEWA_...
VITE_KHALTI_...
```

---

## 📡 API Overview

| Resource | Base Path | Notes |
|----------|-----------|-------|
| Auth | `/api/auth` | register, login, logout, me, forgot/reset password |
| Products | `/api/products` | list (filter/search/sort/paginate), single, CRUD (admin), inventory |
| Categories | `/api/categories` | CRUD |
| Cart | (client-side via CartContext) | variant-aware |
| Orders | `/api/orders` | create, my-orders, get, status update (admin), metrics |
| Users | `/api/users` | profile, change password, addresses, wishlist |
| Messages | `/api/messages` | create, list, reply, status |
| Reviews | `/api/reviews` | create, product reviews, moderate (admin) |
| Payments | `/api/payments` | eSewa & Khalti initiate/verify, status |
| Upload | `/api/upload` | Cloudinary image upload/delete (admin) |
| Analytics | `/api/analytics` | revenue, best-sellers, customers, comparison, summary |

---

## 🧩 Real-Time Messaging (Socket.IO)

The server exposes a Socket.IO instance (attached to `app`). Clients can:
- `join-room {userId}` — users join their personal room
- `join-admin-inbox` — admins join the admin inbox
- `send-message` / `receive-message` — direct messaging
- On message create/reply, the server emits `message:created` / `message:replied` to relevant rooms

The **unified inbox** in the admin panel consolidates messages tagged by source (`tiktok`, `whatsapp`, `facebook`, `website`). Live platform connectors (TikTok / WhatsApp / Facebook) require their own app credentials and webhooks; the platform is structured to accept incoming messages from any source.

---

## ☁️ Deployment

### Frontend → Vercel
1. Push the repo, import `client/` (or root) in Vercel.
2. Set build command `npm run build`, output `dist`.
3. Add `VITE_API_URL=https://your-api.onrender.com/api`.
4. Add a rewrite so client-side routes work: `/* → /index.html`.

### Backend → Render
1. Create a new Web Service pointing to `server/`.
2. Build command: `npm install`.
3. Start command: `npm start`.
4. Set all environment variables from `server/.env.example`.

### Database → MongoDB Atlas
- Create a cluster, get the connection string, set `MONGO_URI`.

### Images → Cloudinary
- Set `CLOUDINARY_*` keys. Admin image uploads go through Cloudinary.

### Custom Domain / SSL / HTTPS
- Point your domain to Vercel/Render and enable HTTPS (both provide free SSL).

---

## 🧪 Testing

- **Client build:** `cd client && npm run build`
- **Client lint:** `cd client && npm run lint`
- **Server load/syntax check:**
  ```bash
  cd server
  node -e "require('./src/app.js'); console.log('OK')"
  ```
- Set up a local MongoDB and run `node src/Utils/seedData.js` to populate demo data.

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Primary (Blue) | `#2563eb` |
| Secondary (Pink/Red) | `#ec4899` |
| Accent (Gold/Yellow) | `#f59e0b` |
| Background (Light Gray) | `#f9fafb` |
| Text (Dark Gray) | `#111827` |
| Font | Inter |

Mobile-first, fully responsive, gradient buttons, card-based layouts, smooth transitions, professional shadows.

---

## 📄 License
MIT
