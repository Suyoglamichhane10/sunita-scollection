const mongoose = require('mongoose');

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2000;

let isConnected = false;

/**
 * Connect to MongoDB with a stable, resilient configuration.
 *
 * - Uses connection pooling + serverSelectionTimeout so transient
 *   network blips do not crash the process.
 * - Implements retry/backoff for the initial connection.
 * - Falls back to an in-memory MongoDB ONLY in development when no URI
 *   is set or the configured DB is unreachable.
 * - In production, DB failure logs an error but does NOT crash the server
 *   (DB-dependent routes will return errors; non-DB routes like the
 *   Google OAuth redirect still work).
 */
const connectDB = async () => {
  // If we already have a live native connection, reuse it.
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    console.warn('⚠️ No MONGO_URI set. Server will start but DB-dependent routes will fail.');
    isConnected = false;
    return null;
  }

  // Configure stable connection options (pooling + sensible timeouts).
  const baseOptions = {
    serverSelectionTimeoutMS: 10000, // fail fast rather than hang forever
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    minPoolSize: 1,
    autoIndex: true,
    family: 4,
  };

  // If a real URI is configured, try to connect to it with retry/backoff.
  if (mongoUri) {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const conn = await mongoose.connect(mongoUri, baseOptions);
        isConnected = true;
        setupConnectionEvents('MongoDB');
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        return conn;
      } catch (err) {
        console.warn(
          `⚠️ MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed: ${err.message}`
        );
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS * attempt); // exponential-ish backoff
        } else {
          console.error('❌ MongoDB connection failed after all retries. Server will continue without DB.');
          isConnected = false;
        }
      }
    }
  }

  // Fallback to in-memory MongoDB for development when no URI provided or all
  // retries failed. Only loaded here (not at module top-level) because
  // mongodb-memory-server is a devDependency and is unavailable in production.
  if (process.env.NODE_ENV !== 'production') {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    const conn = await mongoose.connect(uri, baseOptions);
    isConnected = true;
    setupConnectionEvents('In-memory MongoDB');
    console.log('✅ Connected to in-memory MongoDB for development');
    return conn;
  }

  isConnected = false;
  return null;
};

const isDbConnected = () => isConnected || mongoose.connection.readyState === 1;

const setupConnectionEvents = (name) => {
  const db = mongoose.connection;

  // Clear any previously attached listeners to avoid duplicate handlers on
  // repeated calls (e.g. after a reconnect).
  db.removeAllListeners();

  db.on('disconnected', () => {
    isConnected = false;
    console.error(`❌ ${name} connection lost.`);
  });

  db.on('reconnected', () => {
    isConnected = true;
    console.log(`✅ ${name} reconnected.`);
  });

  db.on('reconnectFailed', () => {
    console.error(`🚨 ${name} auto-reconnect failed after all attempts.`);
  });

  db.on('error', (err) => {
    console.error(`❌ ${name} connection error:`, err.message);
  });

  db.on('connected', () => {
    isConnected = true;
    console.log(`✅ ${name} connected.`);
  });
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = connectDB;
module.exports.isDbConnected = isDbConnected;
