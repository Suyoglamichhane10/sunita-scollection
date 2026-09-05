const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

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

const app = express();

// ✅ Fix rate limiter / CORS behind-proxy warning on Render
app.set('trust proxy', 1);

// ✅ CORS CONFIGURATION - MUST BE FIRST!
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api', limiter);

// Serve uploaded files (product images, avatars, etc.) as static assets.
// This is distinct from serving the client build (which lives on Vercel).
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// ✅ API Routes only - NO STATIC FILE SERVING for client/dist!
// DO NOT add express.static for client/dist here
// DO NOT add app.get('*') catch-all route
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

app.use('/api/payments/stripe/webhook', express.raw({ type: 'application/json' }));
app.use('/api/payments', paymentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
const errorHandler = require('./Middleware/errorHandler');
app.use(errorHandler);

module.exports = app;
