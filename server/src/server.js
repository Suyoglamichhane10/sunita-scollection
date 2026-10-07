// Load environment variables FIRST, before any module that depends on them
const dotenv = require('dotenv');
dotenv.config();

const app = require('./app');
const http = require('http');
const connectDB = require('./config/database');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const PORT = parseInt(process.env.PORT || '5000', 10);
const PORT_FALLBACK = parseInt(process.env.PORT_FALLBACK || '5001', 10);
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

let retryCount = 0;
let activePort = PORT;
let server = null;
let io = null;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

function setupSocketIO(srv) {
  const socketIO = new Server(srv, {
    cors: {
      origin: allowedOrigins.length > 0
        ? allowedOrigins
        : ['https://sunitacollection-frontend.vercel.app', 'http://localhost:5173'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  socketIO.on('connection', (socket) => {
    console.log(`✅ Socket connected: ${socket.id}`);

    socket.on('join-room', (userId) => {
      socket.join(`user_${userId}`);
    });

    socket.on('join-admin-inbox', () => {
      socket.join('admins');
    });

    socket.on('disconnect', () => {
      console.log(`❌ Socket disconnected: ${socket.id}`);
    });
  });

  return socketIO;
}

function startOnPort(port) {
  // Create a FRESH server + socket.io instance each attempt so we never
  // accumulate listeners on a single http.Server object.
  const srv = http.createServer(app);
  io = setupSocketIO(srv);
  app.set('io', io);

  srv.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        console.warn(
          `⚠️ Port ${port} is in use. Retry ${retryCount}/${MAX_RETRIES} in ${RETRY_DELAY_MS}ms...`
        );
        setTimeout(() => startOnPort(port), RETRY_DELAY_MS);
      } else if (port === PORT && PORT_FALLBACK !== port) {
        // All retries on the primary port exhausted — try the fallback port
        console.warn(
          `⚠️ Port ${PORT} unavailable after ${MAX_RETRIES} attempts. Falling back to port ${PORT_FALLBACK}.`
        );
        retryCount = 0;
        activePort = PORT_FALLBACK;
        startOnPort(PORT_FALLBACK);
      } else {
        console.error(
          `❌ Port ${port} is still in use after all attempts. ` +
          `Please free the port manually:\n` +
          `  Windows: netstat -ano | findstr :${port}\n` +
          `           taskkill /F /PID <PID>\n` +
          `  macOS/Linux: lsof -ti :${port} | xargs kill -9`
        );
        process.exit(1);
      }
    } else {
      console.error('❌ Server error:', err);
      process.exit(1);
    }
  });

  srv.on('listening', () => {
    console.log(`✅ Server running on port ${port}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV}`);
    console.log(`✅ Frontend served from Vercel: https://sunitacollection-frontend.vercel.app`);

    // Check Cloudinary configuration
    const isCloudinaryConfigured = () =>
      Boolean(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET &&
        !process.env.CLOUDINARY_API_KEY.includes('your_')
      );

    if (!isCloudinaryConfigured()) {
      console.error('🚨 CRITICAL: Cloudinary credentials not set. Image uploads will fail in production.');
      if (process.env.NODE_ENV === 'production') {
        console.error('🚨 PRODUCTION MODE: Uploads will be REJECTED. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in Render dashboard.');
      } else {
        console.warn('⚠️  Development mode: falling back to local storage (images will not persist on restart)');
      }
    } else {
      console.log('✅ Cloudinary configured - images will be stored permanently');
    }

    // Connect to DB after server is listening
    connectDB().catch((err) => {
      console.error('❌ Database connection failed:', err.message);
      console.error('⚠️  Server continuing without database. DB-dependent routes will return errors.');
    });
  });

  server = srv;
  srv.listen(port, '0.0.0.0');
}

// ---------------------------------------------------------------------------
// Graceful shutdown — registered ONCE, never re-added on retry
// ---------------------------------------------------------------------------
function shutdown() {
  console.log('🛑 Received shutdown signal, closing server gracefully...');
  if (!server) {
    process.exit(0);
  }
  server.close(() => {
    console.log('✅ Server closed.');
    process.exit(0);
  });
  // Force exit after 10s
  setTimeout(() => {
    console.error('❌ Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
});

startOnPort(PORT);