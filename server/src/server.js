const app = require('./app');
const http = require('http');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Connect to the database before starting the server
connectDB().catch((err) => {
  console.error('❌ Fatal: Database connection failed:', err.message);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const io = new Server(server, {
  cors: {
    origin: allowedOrigins.length > 0 ? allowedOrigins : ['https://sunitacollection-frontend.vercel.app', 'http://localhost:5173'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.set('io', io);

io.on('connection', (socket) => {
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

// ✅ NO STATIC FILE SERVING - FRONTEND ON VERCEL
// DO NOT add any express.static for client/dist here

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV}`);
  console.log(`✅ Frontend served from Vercel: https://sunitacollection-frontend.vercel.app`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});