const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (process.env.NODE_ENV === 'production' && !mongoUri) {
      throw new Error('MONGO_URI is required in production. Refusing to start with an in-memory database.');
    }
    if (mongoUri) {
      try {
        const conn = await mongoose.connect(mongoUri);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        return conn;
      } catch (err) {
        console.warn(`⚠️ Failed to connect to configured MongoDB at ${mongoUri}: ${err.message}`);
        if (process.env.NODE_ENV === 'production') throw err;
        console.warn('Attempting to start an in-memory MongoDB for development fallback...');
      }
    }

    // Fallback to in-memory MongoDB for development when no URI provided or connection failed
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    const conn = await mongoose.connect(uri);
    console.log('✅ Connected to in-memory MongoDB for development');
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
