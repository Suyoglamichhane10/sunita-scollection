const app = require('./app');
const http = require('http');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

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