// Load environment variables FIRST, before any module that depends on them
const dotenv = require('dotenv');
dotenv.config();

const app = require('./app');
const http = require('http');
const connectDB = require('./config/database');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

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

// ✅ Start listening BEFORE DB connection so the port is open immediately
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV}`);
  console.log(`✅ Frontend served from Vercel: https://sunitacollection-frontend.vercel.app`);

  // Connect to DB after server is listening
  connectDB().catch((err) => {
    console.error('❌ Database connection failed:', err.message);
    console.error('⚠️  Server continuing without database. DB-dependent routes will return errors.');
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});