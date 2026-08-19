const app = require('./app');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

const server = http.createServer(app);

// Listen error handling (detect EADDRINUSE and other listen errors)
server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Another process is listening on this port.`);
    console.error('Tip: stop the other process or set a different PORT in your .env file.');
    process.exit(1);
  }
  console.error('Server error:', err);
});

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Socket origin is not allowed by CORS'));
    },
    credentials: true,
  },
});

app.set('io', io);

// Socket connection handler
io.on('connection', (socket) => {
  console.log('🟢 New client connected:', socket.id);

  socket.on('join-room', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`📌 User ${userId} joined their room`);
  });

  socket.on('join-admin-inbox', () => {
    socket.join('admins');
  });

socket.on('join-conversation', (conversationId) => {
    socket.join(`conversation_${conversationId}`);
    console.log(`📌 Socket joined conversation ${conversationId}`);
  });

  // Live order tracking: client joins a room per order to receive status updates
  socket.on('join-order', (orderId) => {
    socket.join(`order_${orderId}`);
    console.log(`📦 Socket joined order ${orderId}`);
  });

  socket.on('leave-order', (orderId) => {
    socket.leave(`order_${orderId}`);
  });

  socket.on('leave-conversation', (conversationId) => {
    socket.leave(`conversation_${conversationId}`);
  });

  socket.on('join-delivery-room', (orderId) => {
    socket.join(`order_${orderId}`);
    console.log(`📍 Delivery tracking joined order ${orderId}`);
  });

  socket.on('send-message', (data) => {
    io.to(`user_${data.receiverId}`).emit('receive-message', data);
  });

  // Real-time typing indicator
  socket.on('typing', (data) => {
    socket.to(`conversation_${data.conversationId}`).emit('typing', {
      conversationId: data.conversationId,
      userId: data.userId,
      name: data.name,
      isTyping: data.isTyping,
    });
  });

  // Read receipt
  socket.on('message:read', (data) => {
    io.to(`conversation_${data.conversationId}`).emit('message:read', {
      conversationId: data.conversationId,
      messageId: data.messageId,
      userId: data.userId,
      readAt: Date.now(),
    });
  });

  // Presence tracking
  socket.on('presence:online', (data) => {
    socket.join(`presence_${data.userId}`);
    io.emit('presence:update', { userId: data.userId, online: true });
  });

  socket.on('presence:offline', (data) => {
    socket.leave(`presence_${data.userId}`);
    io.emit('presence:update', { userId: data.userId, online: false });
  });

  socket.on('disconnect', () => {
    console.log('🔴 Client disconnected:', socket.id);
  });
});

// Connect to MongoDB
const connectDB = require('./config/database');

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

if (process.env.SEED_ADMIN === 'true') {
      try {
        const { createAdminUser } = require('./Utils/seedAdmin');
        await createAdminUser();
        console.log('🔧 Admin seed completed');
      } catch (seedErr) {
        console.error('❌ Admin seed failed:', seedErr.message);
      }
    }

    // Auto-seed default chatbot intents so the AI assistant never falls into
    // the "Sorry, I didn't quite understand" fallback due to an empty intents
    // collection. Idempotent and non-destructive (won't overwrite admin edits).
    try {
      const { seedChatbotIntents } = require('./services/chatbotSeedService');
      await seedChatbotIntents();
    } catch (seedErr) {
      console.error('❌ Chatbot intent seed failed:', seedErr.message);
    }

    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  console.error(err.stack);
  server.close(() => {
    process.exit(1);
  });
});
