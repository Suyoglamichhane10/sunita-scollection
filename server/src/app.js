const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const passport = require('passport');
require('./config/passport');
const { isDbConnected } = require('./config/database');

// Import routes
const authRoutes = require('./Routes/authRoutes');
const productRoutes = require('./Routes/productRoutes');
const categoryRoutes = require('./Routes/categoryRoutes');
const orderRoutes = require('./Routes/orderRoutes');
const userRoutes = require('./Routes/userRoutes');
const slideRoutes = require('./Routes/slideRoutes');
const recommendationRoutes = require('./Routes/recommendationRoutes');
const messageRoutes = require('./Routes/messageRoutes');
const dashboardRoutes = require('./Routes/dashboardRoutes');
const uploadRoutes = require('./Routes/uploadRoutes');
const paymentRoutes = require('./Routes/paymentRoutes');
const socialRoutes = require('./Routes/socialRoutes');
const webhookRoutes = require('./Routes/webhookRoutes');
const chatbotRoutes = require('./Routes/chatbotRoutes');
const analyticsRoutes = require('./Routes/analyticsRoutes');
const deliveryRoutes = require('./Routes/deliveryRoutes');
const marketingRoutes = require('./Routes/marketingRoutes');
const loyaltyRoutes = require('./Routes/loyaltyRoutes');
const wishlistRoutes = require('./Routes/wishlistRoutes');
const reviewRoutes = require('./Routes/reviewRoutes');
const conversationRoutes = require('./Routes/conversationRoutes');
const googleRoutes = require('./Routes/googleRoutes');
const enquiryRoutes = require('./Routes/enquiryRoutes');
const notificationRoutes = require('./Routes/notificationRoutes');

const app = express();

// ✅ Fix rate limiter / CORS behind-proxy warning on Render
app.set('trust proxy', 1);

// ✅ CORS CONFIGURATION - MUST BE FIRST!
const corsOptions = {
  origin: function (origin, callback) {
    // Build allowed origins from env var, falling back to defaults
    const envOrigins = (process.env.FRONTEND_URL || '')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);

    const allowedOrigins = [
      'https://sunitacollection-frontend.vercel.app',
      ...envOrigins,
      'http://localhost:5173',
      'http://localhost:3000'
    ];

    // Allow requests with no origin (health checks, direct navigation, server-to-server)
    // CORS is browser-enforced: browsers always send Origin for cross-origin requests
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('🚫 Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Total-Count'],
  optionsSuccessStatus: 200
};

// ✅ Apply CORS middleware FIRST
app.use(cors(corsOptions));

// ✅ Handle preflight OPTIONS requests
app.options('*', cors(corsOptions));

// Other middleware
app.use(helmet());
app.use(compression());
app.use(cookieParser());
app.use('/api/payments/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(
  session({
    secret: (() => {
      const secret = process.env.SESSION_SECRET || process.env.JWT_SECRET;
      if (!secret) {
        if (process.env.NODE_ENV === 'production') {
          throw new Error('SESSION_SECRET or JWT_SECRET must be set in production');
        }
        return 'change-this-session-secret-in-development';
      }
      return secret;
    })(),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());

// Rate limiting - stricter for authenticated routes, lenient for public
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500 // higher limit for public API routes
});

// Apply strict limiter to auth-sensitive routes
  app.use('/api/auth', strictLimiter);
  app.use('/api/orders', strictLimiter);
  app.use('/api/users', strictLimiter);
  app.use('/api/dashboard', strictLimiter);
  app.use('/api/upload', strictLimiter);
  app.use('/api/payments', strictLimiter);
  app.use('/api/wishlist', strictLimiter);
  app.use('/api/reviews', strictLimiter);
  app.use('/api/conversations', strictLimiter);

// Apply lenient limiter to public routes
  app.use('/api/products', publicLimiter);
  app.use('/api/categories', publicLimiter);
  app.use('/api/slides', publicLimiter);
  app.use('/api/recommendations', publicLimiter);
  app.use('/api/messages', publicLimiter);
  app.use('/api/social', publicLimiter);
  app.use('/api/analytics', publicLimiter);
  app.use('/api/delivery', publicLimiter);
  app.use('/api/marketing', publicLimiter);
  app.use('/api/loyalty', publicLimiter);
  app.use('/api/chatbot', publicLimiter);

  // Read-only polling limiter - higher limit for polling endpoints
  const pollLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute per IP
  });

// Serve uploaded files (product images, avatars, etc.) as static assets.
// This is distinct from serving the client build (which lives on Vercel).
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});
app.use('/uploads', express.static(uploadsDir));

// ✅ API Routes - Google mounted BEFORE authRoutes to prevent any path conflicts
app.use('/api/auth', googleRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/slides', slideRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/messages/webhook', webhookRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/marketing', marketingRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/notifications', notificationRoutes);

app.use('/api/payments', paymentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  const dbConnected = isDbConnected();
  res.status(200).json({
    success: true,
    status: dbConnected ? 'OK' : 'DEGRADED',
    message: 'Server is running',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

  // Root health check for Render's default health check path
  app.get('/', (req, res) => {
    res.status(200).json({
      status: 'OK',
      message: 'ShopSync Server is running',
      timestamp: new Date().toISOString(),
    });
  });

// Error handling middleware
const errorHandler = require('./Middleware/errorHandler');
app.use(errorHandler);

module.exports = app;
