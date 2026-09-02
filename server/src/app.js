const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const app = express();
const path = require('path');

const allowedOrigins = (
  process.env.FRONTEND_URL ||
  'http://localhost:5173,http://localhost:3000,https://sunitacollection-frontend.vercel.app,https://sunitacollection-backend.onrender.com'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Rate limiting
const isDev = process.env.NODE_ENV === 'development';
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(compression());

app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'",
      "http://localhost:5173",
      "http://localhost:3000",
    ],
    styleSrc: [
      "'self'",
      "'unsafe-inline'",
      "http://localhost:5173",
      "https://fonts.googleapis.com",
    ],
    imgSrc: [
      "'self'",
      "data:",
      "blob:",
      "http://localhost:5173",
      "http://localhost:5000",
      "https://res.cloudinary.com",
    ],
    connectSrc: [
      "'self'",
      "http://localhost:5173",
      "http://localhost:5000",
      "ws://localhost:5000",
      "wss://localhost:5000",
      "https://api.fonepay.com",
      "https://dev.fonepay.com",
      "https://epay.esewa.com.np",
      "https://rc-epay.esewa.com.np",
      "https://a.khalti.com",
      "https://khalti.com",
      "https://api.stripe.com",
    ],
    fontSrc: [
      "'self'",
      "data:",
      "https://fonts.gstatic.com",
      "https://fonts.googleapis.com",
    ],
    frameSrc: [
      "'self'",
      "https://epay.esewa.com.np",
      "https://rc-epay.esewa.com.np",
      "https://a.khalti.com",
      "https://khalti.com",
      "https://api.stripe.com",
      "https://checkout.stripe.com",
      "https://js.stripe.com",
    ],
    formAction: [
      "'self'",
      "https://epay.esewa.com.np",
      "https://rc-epay.esewa.com.np",
      "https://a.khalti.com",
      "https://khalti.com",
      "https://api.stripe.com",
      "https://checkout.stripe.com",
    ],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
  },
  reportOnly: isDev,
}));

// Cache control for API responses
app.use((req, res, next) => {
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=120');
  } else {
    res.setHeader('Cache-Control', 'no-store');
  }
  next();
});

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (isDev) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    const normalized = origin.replace(/\/$/, '');
    if (allowedOrigins.includes(normalized)) return callback(null, true);
    console.warn(`[CORS] Blocked origin: ${origin}`);
    return callback(new Error(`Origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Total-Count'],
}));
app.use(cookieParser());

// Stripe webhook must receive the RAW body so the signature can be verified.
// Mount this raw-body route BEFORE the global express.json() middleware.
const stripeWebhookRouter = express.Router();
const stripeWebhookController = require('./controllers/paymentController').stripeWebhook;
stripeWebhookRouter.post(
  '/stripe/webhook',
  express.raw({ type: 'application/json' }),
  stripeWebhookController
);
app.use('/api/payments', stripeWebhookRouter);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

if (!isDev) {
  app.use('/api', limiter);
  app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false }));
} else {
  app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 2000, standardHeaders: true, legacyHeaders: false }));
  app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 500, standardHeaders: true, legacyHeaders: false }));
}

// Import routes
const authRoutes = require('./Routes/authRoutes');
const productRoutes = require('./Routes/productRoutes');
const categoryRoutes = require('./Routes/categoryRoutes');
const orderRoutes = require('./Routes/orderRoutes');
const userRoutes = require('./Routes/userRoutes');
const messageRoutes = require('./Routes/messageRoutes');
const analyticsRoutes = require('./Routes/analyticsRoutes');
const reviewRoutes = require('./Routes/reviewRoutes');
const paymentRoutes = require('./Routes/paymentRoutes');
const uploadRoutes = require('./Routes/uploadRoutes');
const chatbotRoutes = require('./Routes/chatbotRoutes');
const conversationRoutes = require('./Routes/conversationRoutes');
const recommendationRoutes = require('./Routes/recommendationRoutes');
const loyaltyRoutes = require('./Routes/loyaltyRoutes');
const dashboardRoutes = require('./Routes/dashboardRoutes');
const socialRoutes = require('./Routes/socialRoutes');
const marketingRoutes = require('./Routes/marketingRoutes');
const webhookRoutes = require('./Routes/webhookRoutes');
const deliveryRoutes = require('./Routes/deliveryRoutes');
const wishlistRoutes = require('./Routes/wishlistRoutes');
const slideRoutes = require('./Routes/slideRoutes');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/marketing', marketingRoutes);
app.use('/api/messages/webhook', webhookRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/wishlist', require('./Routes/wishlistRoutes'));
app.use('/api/slides', slideRoutes);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Root route - frontend is served by Vercel
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'sunitacollection-backend',
    message: 'API is running. Frontend is served from Vercel: https://sunitacollection-frontend.vercel.app',
  });
});

// Catch-all for non-API routes: return JSON instead of attempting to serve index.html
app.use((req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
    return next();
  }
  res.status(404).json({
    success: false,
    message: 'Not found. Frontend is served from Vercel: https://sunitacollection-frontend.vercel.app',
  });
});

// Error handling middleware
const errorHandler = require('./Middleware/errorHandler');
app.use(errorHandler);

module.exports = app;
