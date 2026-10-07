# Sunita'z Collection — Complete Workflow Document

## Project Overview
- **Project Name:** Sunita'z Collection
- **Type:** MERN E-commerce Platform
- **Frontend:** React + Vite, deployed on Vercel
- **Backend:** Node.js + Express, deployed on Render
- **Database:** MongoDB Atlas
- **Image Storage:** Cloudinary
- **Payment Gateways:** COD, eSewa, FonePay (no Khalti)

---

## Repository Structure

### GitHub Repositories
1. **Backend + Full Stack:** https://github.com/Suyoglamichhane10/sunita-scollection.git
   - Contains both client/ and server/ directories
   - Main branch: `main`
   - Latest commit: `6f7c45c`

2. **Frontend Only:** https://github.com/Suyoglamichhane10/sunitacollection-frontend.git
   - Contains client/ directory
   - Main branch: `main`
   - Latest commit: `6f7c45c`

### Local Directory Structure
```
C:\Users\DELL\Desktop\Sunita's Collection/
├── client/                          # Frontend React app
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/               # Admin panel components
│   │   │   ├── common/              # Shared components (Navbar, Footer, etc.)
│   │   │   ├── home/                # Homepage components
│   │   │   ├── products/            # Product-related components
│   │   │   └── shop/                # Shop page components
│   │   ├── pages/
│   │   │   ├── admin/               # Admin pages
│   │   │   ├── customer/            # Customer pages
│   │   │   └── Auth/                # Login, Register, etc.
│   │   ├── Layouts/                 # Layout components
│   │   ├── Context/                 # React Context providers
│   │   ├── Routes/                  # Route definitions
│   │   └── Services/                # API services
│   └── package.json
├── server/                          # Backend Node.js app
│   ├── src/
│   │   ├── Models/                  # Mongoose models
│   │   ├── controllers/             # Route controllers
│   │   ├── Routes/                  # Express routes
│   │   ├── Middleware/              # Custom middleware
│   │   ├── config/                  # Configuration files
│   │   ├── Utils/                   # Utility scripts
│   │   └── services/                # Business logic services
│   ├── package.json
│   └── ecosystem.config.cjs
├── docs/                            # Documentation
├── scripts/                         # Deployment scripts
└── render.yaml                      # Render deployment config
```

---

## Deployment URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | https://sunitacollection-frontend.vercel.app | Customer-facing website |
| **Backend API** | https://sunitacollection-backend.onrender.com/api | REST API |
| **Backend Health** | https://sunitacollection-backend.onrender.com/api/health | Health check |
| **Admin Panel** | https://sunitacollection-frontend.vercel.app/admin | Admin dashboard |

---

## Admin Credentials
- **Email:** admin@shopsync.com
- **Password:** Admin123!
- **Role:** admin
- **Login URL:** https://sunitacollection-frontend.vercel.app/login

---

## Technology Stack

### Frontend
- React 18+ with Vite
- React Router DOM (routing)
- Tailwind CSS (styling)
- Framer Motion (animations)
- React Hot Toast (notifications)
- React Icons (icon library)
- Axios (API calls)
- Socket.IO Client (real-time)

### Backend
- Node.js 20+
- Express.js (web framework)
- MongoDB + Mongoose (database)
- JWT (authentication)
- Bcrypt (password hashing)
- Multer (file uploads)
- Socket.IO (real-time)
- Nodemailer (emails)
- Helmet (security)
- Express Rate Limit (rate limiting)
- Compression (gzip)

### Third-Party Services
- **MongoDB Atlas** — Database
- **Cloudinary** — Image hosting
- **eSewa** — Payment gateway (test mode)
- **FonePay** — Payment gateway (test mode)
- **Vercel** — Frontend hosting
- **Render** — Backend hosting

---

## Complete Feature List

### Customer Features
1. **Homepage**
   - Full-page hero slideshow (6 slides)
   - Service highlights (Delivery, Payments, Support, Curation)
   - Category exploration
   - Continue Browsing (recently viewed)
   - New Arrivals section
   - Featured Picks section
   - Best Sellers section
   - Trending Now section
   - Shop by Brand
   - Shop by Color
   - Product Marquee
   - Payment Partners section
   - CTA section

2. **Shop Page**
   - Product grid with filters
   - Category filtering
   - Sort options (newest, price, popularity)
   - Search with YouTube-style autocomplete
   - Product quick view modal

3. **Product Detail Page**
   - Image gallery
   - Variant selection (color/size)
   - Stock status badges
   - Add to cart
   - Add to wishlist
   - Enquiry form

4. **Cart & Checkout**
   - Cart management
   - Deal price support
   - Multiple payment methods (COD, eSewa, FonePay)
   - Address selection
   - Order summary

5. **Customer Dashboard** (`/dashboard`)
   - Overview tab (welcome banner, order summary, quick actions, recent orders)
   - Orders tab (order history, tracking, cancellation)
   - Messages tab (conversation list)
   - Enquiries tab (product enquiries, price negotiation)
   - Wishlist tab
   - Profile tab (edit profile, change password)
   - Rewards tab (loyalty points, referral program)
   - Tab marquee/swiper on mobile

6. **Enquiry System**
   - Send enquiry on products
   - Admin replies with price quotes
   - Customer can Agree, Counter Offer, or Request Call
   - Deal price negotiation
   - Add to cart at deal price
   - Call-to-confirm flow

7. **Authentication**
   - Email/password registration
   - Email/password login
   - Google OAuth login
   - Password reset via email
   - Session management

8. **Orders**
   - Order tracking
   - Order history
   - Order cancellation
   - Invoice download
   - Reorder

9. **Profile Management**
   - Edit profile (name, phone, address)
   - Change password
   - Avatar upload/delete
   - Address book

10. **Notifications**
    - Real-time notification bell
    - Unread count badge
    - Notification types: enquiry, order, message, rewards
    - Mark all as read
    - Deep linking to dashboard sections

### Admin Features
1. **Admin Dashboard** (`/admin`)
   - Overview tab
   - Products management
   - Inventory management
   - Categories management
   - Orders management
   - Delivery tracking
   - Enquiries management
   - Analytics
   - Slideshow management
   - Messages
   - Inbox (conversations)
   - Customer management
   - Reports
   - Marketing (coupons, activity logs)
   - Profile

2. **Enquiry Management**
   - View all enquiries
   - Filter by status
   - Search by name/phone/product
   - Reply to enquiries
   - Share price (Approve Price button)
   - Call customer (tel: link)
   - Update final price
   - Reject enquiries
   - Delete enquiries
   - Real-time unread badge

3. **Order Management**
    - View all orders
    - Update order status
    - Cancel orders
    - Delete orders
    - Track deliveries
    - Assign delivery persons

4. **Product Management**
    - Create/Edit/Delete products
    - Toggle product status
    - Toggle featured status
    - Update stock
    - Bulk stock updates
    - Category assignments
    - Image uploads

5. **Category Management**
    - Create/Edit/Delete categories
    - Reorder categories

6. **Delivery Management**
    - Create delivery persons
    - Track active deliveries
    - Delivery stats
    - Nearby delivery persons
    - Assign delivery persons to orders
    - Update delivery status
    - Location tracking

7. **Marketing**
    - Create/Edit/Delete coupons
    - Activity logs

8. **Slideshow Management**
    - Upload slides
    - Reorder slides
    - Toggle active/inactive

9. **User Management**
    - View all customers
    - Update user roles
    - Delete users

---

## Database Models

### User Model
```javascript
{
  name: String,
  email: String (unique, lowercase),
  password: String (hashed, select: false),
  role: String (enum: ['customer', 'admin', 'supplier'], default: 'customer'),
  phone: String,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String (default: 'Nepal')
  },
  addresses: [{
    fullName: String,
    phone: String,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    isDefault: Boolean
  }],
  avatar: String (default: 'default-avatar.png'),
  avatarPublicId: String,
  socialProvider: String (enum: ['local', 'facebook', 'google', 'apple']),
  socialId: String,
  isEmailVerified: Boolean (default: false),
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  lastLogin: Date,
  wishlist: [{ type: ObjectId, ref: 'Product' }],
  cart: [{
    product: { type: ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, default: 1, min: 1 },
    variantSku: String
  }],
  orderHistory: [{ type: ObjectId, ref: 'Order' }],
  styleProfile: {
    sizes: { top: String, bottom: String, footwear: String },
    preferences: {
      colors: [String],
      styles: [String],
      occasions: [String],
      priceRange: { min: Number, max: Number }
    },
    fitPreference: String (enum: ['relaxed', 'regular', 'fitted']),
    language: String (enum: ['en', 'ne'])
  },
  recentlyViewed: [{ type: ObjectId, ref: 'Product', viewedAt: Date }],
  savedLooks: [{
    name: String,
    items: [{ type: ObjectId, ref: 'Product' }],
    image: String,
    createdAt: Date
  }],
  loyalty: { type: ObjectId, ref: 'Gamification' },
  referralCode: String,
  notifications: [{
    message: String,
    type: String (enum: ['order', 'promotion', 'system']),
    read: Boolean,
    createdAt: Date
  }],
  isDeliveryPerson: Boolean (default: false),
  vehicle: String (enum: ['bike', 'car', 'van', 'truck', 'foot']),
  vehicleNumber: String,
  currentLocation: { lat: Number, lng: Number, updatedAt: Date },
  isAvailable: Boolean
}
```

### Order Model
```javascript
{
  orderNumber: String (unique),
  user: { type: ObjectId, ref: 'User' },
  items: [{
    product: { type: ObjectId, ref: 'Product' },
    name: String,
    price: Number,
    quantity: Number,
    image: String,
    variantSku: String
  }],
  shippingAddress: {
    fullName: String,
    phone: String,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  paymentMethod: String (enum: ['cod', 'esewa', 'fonepay', 'stripe']),
  paymentStatus: String (enum: ['pending', 'paid', 'failed', 'refunded']),
  orderStatus: String (enum: ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled']),
  totalAmount: Number,
  subtotal: Number,
  tax: Number,
  shipping: Number,
  discount: Number,
  couponCode: String,
  notes: String,
  trackingNumber: String,
  estimatedDelivery: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  isDeal: Boolean (default: false),
  dealPrice: Number
}
```

### Product Model
```javascript
{
  name: String,
  slug: String (unique),
  description: String,
  price: Number,
  comparePrice: Number,
  category: { type: ObjectId, ref: 'Category' },
  images: [{ url: String, isMain: Boolean }],
  brand: String,
  variants: [{
    title: String,
    sku: String,
    attributes: { color: String, size: String },
    price: Number,
    stock: Number,
    images: [{ url: String, isMain: Boolean }]
  }],
  stock: Number,
  lowStockThreshold: Number,
  isActive: Boolean (default: true),
  isFeatured: Boolean (default: false),
  tags: [String],
  specifications: Map,
  careInstructions: String
}
```

### Category Model
```javascript
{
  name: String,
  slug: String (unique),
  description: String,
  image: String,
  order: Number,
  isActive: Boolean (default: true)
}
```

### Enquiry Model
```javascript
{
  productId: { type: ObjectId, ref: 'Product' },
  productName: String,
  userId: { type: ObjectId, ref: 'User' },
  name: String,
  phone: String,
  email: String,
  message: String,
  status: String (enum: ['pending', 'price_shared', 'negotiating', 'customer_agreed', 'deal_closed', 'rejected', 'converted']),
  quotedPrice: Number,
  counterPrice: Number,
  dealPrice: Number,
  adminReply: String,
  repliedAt: Date,
  approvedAt: Date,
  readByAdmin: Boolean,
  readByCustomer: Boolean,
  messages: [{
    sender: String (enum: ['customer', 'admin']),
    text: String,
    price: Number,
    type: String (enum: ['reply', 'agree', 'counter', 'call', 'disagree', 'final']),
    createdAt: Date
  }]
}
```

### Slide Model
```javascript
{
  imageUrl: String,
  imagePublicId: String,
  title: String,
  subtitle: String,
  buttonText: String,
  buttonLink: String,
  order: Number,
  isActive: Boolean (default: true)
}
```

---

## Environment Variables

### Backend (.env)
```env
# Server Configuration
NODE_ENV=production
PORT=5000

# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/shopsync

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Frontend URL
FRONTEND_URL=https://sunitacollection-frontend.vercel.app

# Admin
ADMIN_EMAIL=admin@shopsync.com

# Payment Gateways
ESEWA_MERCHANT_ID=EPAYTEST
ESEWA_PRODUCT_CODE=EPAYTEST
ESEWA_SECRET_KEY=your_secret
ESEWA_ENV=test
ESEWA_TEST_MODE=true
ESEWA_URL=https://rc-epay.esewa.com.np/api/epay/main/v2/form
ESEWA_STATUS_URL=https://rc.esewa.com.np/api/epay/transaction/status/

KHALTI_SECRET_KEY=your_secret_key
KHALTI_ENV=test
KHALTI_BASE_URL=https://api.khalti.com/api/v2

FONEPAY_MERCHANT_ID=your_merchant_id
FONEPAY_MERCHANT_SECRET=your_secret
FONEPAY_APP_ID=your_app_id
FONEPAY_ENV=test
FONEPAY_BASE_URL=https://api.fonepay.com

# Facebook OAuth
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
FACEBOOK_CALLBACK_URL=https://sunitacollection-backend.onrender.com/api/auth/facebook/callback
```

### Frontend (.env)
```env
VITE_API_URL=https://sunitacollection-backend.onrender.com/api
VITE_SOCKET_URL=https://sunitacollection-backend.onrender.com
```

---

## Deployment Configuration

### Render (Backend)
- **Service Type:** Web Service
- **Root Directory:** server
- **Runtime:** Node
- **Build Command:** npm ci --omit=dev
- **Start Command:** node src/server.js
- **Node Version:** 20+
- **Health Check:** /api/health
- **Auto-Deploy:** Yes (from GitHub)

### Vercel (Frontend)
- **Root Directory:** client
- **Build Command:** npm run build
- **Output Directory:** dist
- **Framework:** Vite
- **Node Version:** 18+
- **Environment Variables:**
  - VITE_API_URL=https://sunitacollection-backend.onrender.com/api
  - VITE_SOCKET_URL=https://sunitacollection-backend.onrender.com
- **Rewrites:** `/(.*)` → `/index.html`

---

## Setup Instructions

### Prerequisites
1. Node.js 20+ installed
2. MongoDB Atlas account
3. Cloudinary account
4. GitHub account
5. Vercel account
6. Render account

### Local Development Setup

1. **Clone repository:**
   ```bash
   git clone https://github.com/Suyoglamichhane10/sunita-scollection.git
   cd sunita-scollection
   ```

2. **Install dependencies:**
   ```bash
   # Server
   cd server
   npm install

   # Client
   cd ../client
   npm install
   ```

3. **Configure environment:**
   ```bash
   # Server
   cp server/.env.example server/.env
   # Edit server/.env with your values

   # Client
   cp client/.env.example client/.env
   # Edit client/.env with your values
   ```

4. **Start development servers:**
   ```bash
   # Terminal 1 - Backend
   cd server
   npm run dev

   # Terminal 2 - Frontend
   cd client
   npm run dev
   ```

5. **Access application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000/api
   - Admin Panel: http://localhost:5173/admin

### Production Deployment

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "feat: your changes"
   git push origin main
   ```

2. **Deploy Backend (Render):**
   - Go to https://dashboard.render.com
   - Service: sunitas-collection-backend
   - Manual Deploy → Clear build cache & deploy

3. **Deploy Frontend (Vercel):**
   - Go to https://vercel.com
   - Project: sunitacollection-frontend
   - Deployments → Redeploy latest

4. **Seed initial data (first time only):**
   ```bash
   # Run seed script to create admin user and seed data
   cd server
   node src/Utils/seedAdmin.js
   node src/Utils/seedData.js
   ```

---

## Complete Workflow Done So Far

### Phase 1: Initial Setup
- ✅ Created MERN stack project structure
- ✅ Set up MongoDB Atlas database
- ✅ Configured Cloudinary for image hosting
- ✅ Set up GitHub repositories (2 repos)
- ✅ Configured Vercel for frontend hosting
- ✅ Configured Render for backend hosting

### Phase 2: Core E-commerce Features
- ✅ User authentication (email/password + Google OAuth)
- ✅ Product catalog with categories
- ✅ Shopping cart
- ✅ Checkout flow
- ✅ Order management
- ✅ Payment integration (COD, eSewa, FonePay)
- ✅ Address management
- ✅ Profile management

### Phase 3: Advanced Features
- ✅ Enquiry system (customer ↔ admin negotiation)
- ✅ Real-time notifications (Socket.IO)
- ✅ Admin panel with full CRUD
- ✅ Product variants (color/size)
- ✅ Stock management
- ✅ Order tracking
- ✅ Delivery management
- ✅ Loyalty/rewards program
- ✅ Referral system
- ✅ Wishlist
- ✅ Recently viewed products
- ✅ Product recommendations

### Phase 4: UI/UX Enhancements
- ✅ Full-page hero slideshow (6 slides)
- ✅ Product marquee
- ✅ Service highlights
- ✅ Category cards
- ✅ Brand sections
- ✅ Color-based shopping
- ✅ Quick view modal
- ✅ Typewriter animations
- ✅ Tab marquee on dashboard
- ✅ Mobile-responsive admin sidebar
- ✅ Loading skeletons
- ✅ Error boundaries
- ✅ Toast notifications

### Phase 5: Admin Panel
- ✅ Admin authentication & authorization
- ✅ Product management (CRUD)
- ✅ Category management
- ✅ Order management (status updates, cancellation)
- ✅ Enquiry management (reply, price quotes, call)
- ✅ Delivery person management
- ✅ Slideshow management
- ✅ User management
- ✅ Analytics & reports
- ✅ Marketing (coupons, activity logs)
- ✅ Notification center

### Phase 6: Recent Fixes & Improvements
- ✅ Fixed admin role enum validation error (Admin → admin)
- ✅ Restored 6-slide homepage slideshow
- ✅ Reverted to default FullPageHeroSlideshow (local assets)
- ✅ Fixed Dashboard.jsx "Back to Home" button
- ✅ Consolidated enquiry reply panel (Approve Price + Call Customer)
- ✅ Fixed mobile admin sidebar drawer
- ✅ Fixed CORS configuration
- ✅ Fixed MongoDB connection retry logic
- ✅ Fixed password reset flow
- ✅ Fixed order lifecycle (deal price, enquiry conversion)
- ✅ Fixed payment integration (removed Khalti, kept COD/eSewa/FonePay)
- ✅ Fixed notification bell (single instance, deep linking)
- ✅ Fixed navbar (5 links only, no duplicate icons)
- ✅ Fixed footer (simplified links)
- ✅ Fixed dashboard hash sections
- ✅ Fixed enquiry-to-purchase flow

---

## Current Git State

### Backend Repo (origin)
- **Remote:** https://github.com/Suyoglamichhane10/sunita-scollection.git
- **Branch:** main
- **Latest Commit:** `6f7c45c`
- **Commit Message:** feat: enquiry reply panel, admin layout fixes, notifications, delivery, orders UX
- **Files Changed:** 49 files, +2574 insertions, -298 deletions
- **Status:** Clean, pushed

### Frontend Repo (frontend)
- **Remote:** https://github.com/Suyoglamichhane10/sunitacollection-frontend.git
- **Branch:** main
- **Latest Commit:** `6f7c45c`
- **Commit Message:** feat: enquiry reply panel, admin layout fixes, notifications, delivery, orders UX
- **Status:** Clean, pushed

---

## How to Deploy

### Step 1: Push Code to GitHub
```bash
# Already done! Both repos are at commit 6f7c45c
# If you make changes:
git add .
git commit -m "feat: your changes"
git push origin main
git push frontend main
```

### Step 2: Redeploy Backend on Render
```bash
# Option A: Dashboard (recommended)
1. Go to https://dashboard.render.com
2. Select sunitas-collection-backend
3. Click "Manual Deploy" → "Clear build cache & deploy"
4. Wait for build to complete

# Option B: CLI (if logged in)
render deploy sunitas-collection-backend --clear-cache
```

### Step 3: Redeploy Frontend on Vercel
```bash
# Option A: Dashboard (recommended)
1. Go to https://vercel.com
2. Select sunitacollection-frontend
3. Deployments → Redeploy latest

# Option B: CLI (if logged in)
cd client
vercel --prod
```

### Step 4: Re-seed Data (if needed)
```bash
# After Render deploys, re-seed slides:
# Render Dashboard → sunitas-collection-backend → Shell
cd /opt/render/project/src/server
node src/Utils/seedData.js
```

### Step 5: Verify Deployments
```bash
# Backend health
curl https://sunitacollection-backend.onrender.com/api/health

# Frontend loads
curl https://sunitacollection-frontend.vercel.app

# Admin login test
curl -X POST https://sunitacollection-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@shopsync.com","password":"Admin123!"}'
```

---

## Known Issues & Solutions

### Issue: "Back to Home" button not showing
**Solution:** Code is present in Dashboard.jsx:670-678. Redeploy Vercel.

### Issue: Admin role enum validation error
**Solution:** Changed `role: 'Admin'` to `role: 'admin'` in seedAdmin.js. Redeploy Render.

### Issue: Only 3 slides showing
**Solution:** Added 3 more slides to seedData.js (total 6). Re-seed data on Render.

### Issue: Enquiry reply panel has multiple price buttons
**Solution:** Consolidated to single "Approve Price" button + "Call Customer" button.

### Issue: Mobile admin sidebar not working
**Solution:** Fixed drawer behavior and styling in AdminLayout.jsx.

### Issue: CORS errors
**Solution:** Fixed CORS configuration in app.js with origin callback.

### Issue: MongoDB connection drops
**Solution:** Added retry logic with exponential backoff in database.js.

---

## Testing Checklist

### Customer Flow
- [ ] Register new account
- [ ] Login with email/password
- [ ] Login with Google OAuth
- [ ] Browse products
- [ ] Search products
- [ ] Add to cart
- [ ] Add to wishlist
- [ ] Send enquiry
- [ ] View orders
- [ ] Track order
- [ ] Cancel order
- [ ] Update profile
- [ ] Change password
- [ ] Upload avatar
- [ ] Add address
- [ ] View rewards
- [ ] Copy referral link
- [ ] Logout

### Admin Flow
- [ ] Login as admin
- [ ] View dashboard overview
- [ ] Manage products (CRUD)
- [ ] Manage categories
- [ ] Manage orders (status updates)
- [ ] Manage deliveries
- [ ] Reply to enquiries
- [ ] Share price with customers
- [ ] Call customer (tel: link)
- [ ] Update final price
- [ ] Reject enquiry
- [ ] Manage slideshow
- [ ] View analytics
- [ ] Manage coupons
- [ ] View activity logs
- [ ] Manage users
- [ ] Send follow-up emails

### Payment Flow
- [ ] COD checkout
- [ ] eSewa checkout (test mode)
- [ ] FonePay checkout (test mode)
- [ ] Order created successfully
- [ ] Payment status updated
- [ ] Enquiry converted to order (if deal)

### Mobile Testing
- [ ] Mobile navbar hamburger menu
- [ ] Mobile admin sidebar drawer
- [ ] Mobile tab marquee
- [ ] Touch swipe on dashboard tabs
- [ ] Product grid responsive
- [ ] Cart mobile view
- [ ] Checkout mobile view
- [ ] Admin panel mobile view

---

## Important Notes

1. **No Khalti:** Khalti has been removed from the codebase entirely. Only COD, eSewa, and FonePay are supported.

2. **Role Enum:** User roles must be lowercase: `customer`, `admin`, `supplier`. Uppercase values will cause validation errors.

3. **Seed Scripts:**
   - `npm run seed` — Seeds categories, products, slides, chatbot intents
   - `npm run seed:admin` — Creates admin user (admin@shopsync.com / Admin123!)

4. **Environment Variables:**
   - Never commit `.env` files
   - Use provider dashboards (Vercel, Render) for production secrets
   - Rotate keys immediately if exposed

5. **CORS:**
   - Backend uses `FRONTEND_URL` env var
   - Must be exact HTTPS origins
   - Comma-separated for multiple origins

6. **Database:**
   - Production uses MongoDB Atlas
   - Never expose MongoDB port 27017 publicly
   - Regular backups recommended

7. **File Uploads:**
   - Product images and avatars use Cloudinary
   - Uploads directory on Render is ephemeral
   - Never rely on local file storage in production

---

## Next Steps

1. **Enable auto-deploy** on both Vercel and Render
2. **Set up monitoring** (Sentry, UptimeRobot)
3. **Configure email** (Nodemailer with Gmail/Outlook)
4. **Set up Stripe** for card payments (when ready)
5. **Add SEO metadata** to all pages
6. **Run Lighthouse** audits on key pages
7. **Set up CI/CD** with GitHub Actions
8. **Configure custom domain** on Vercel
9. **Set up SSL certificate** (automatic on Vercel/Render)
10. **Add privacy policy, terms, refund policy**

---

## Support & Documentation

- **Frontend Repo:** https://github.com/Suyoglamichhane10/sunitacollection-frontend
- **Backend Repo:** https://github.com/Suyoglamichhane10/sunita-scollection
- **Frontend URL:** https://sunitacollection-frontend.vercel.app
- **Backend URL:** https://sunitacollection-backend.onrender.com
- **Admin Panel:** https://sunitacollection-frontend.vercel.app/admin

---

## Quick Commands Reference

### Local Development
```bash
# Start backend
cd server && npm run dev

# Start frontend
cd client && npm run dev

# Run tests
cd server && npm test

# Seed data
cd server && npm run seed
cd server && npm run seed:admin
```

### Git Commands
```bash
# Check status
git status

# Stage changes
git add .

# Commit
git commit -m "feat: your changes"

# Push to backend repo
git push origin main

# Push to frontend repo
git push frontend main
```

### Deployment
```bash
# Redeploy backend (Render CLI)
render deploy sunitas-collection-backend --clear-cache

# Redeploy frontend (Vercel CLI)
cd client && vercel --prod

# Check backend health
curl https://sunitacollection-backend.onrender.com/api/health
```

---

**Document Version:** 1.0  
**Last Updated:** 2026-10-07  
**Status:** Production Ready ✅
