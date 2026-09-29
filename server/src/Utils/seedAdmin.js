const crypto = require('crypto');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../Models/User');

dotenv.config();

async function seedAdmin() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI or MONGODB_URI is not set in environment variables.');
    }

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000,
      family: 4,
    });
    console.log('✅ MongoDB Connected');

    const adminExists = await User.findOne({ email: 'admin@shopsync.com' });
    if (adminExists) {
      console.log('✅ Admin user already exists');
      console.log(`📧 Email: ${adminExists.email}`);
      process.exit(0);
    }

    console.log('📦 Creating admin user...');
    const password = process.env.SEED_ADMIN_PASSWORD || crypto.randomBytes(18).toString('hex');
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@shopsync.com',
      password,
      role: 'admin',
      isEmailVerified: true,
      phone: '9800000000',
    });

    console.log('✅ Admin created successfully!');
    console.log(`📧 Email: ${admin.email}`);
    console.log(`🔑 Password: ${process.env.SEED_ADMIN_PASSWORD ? '(from SEED_ADMIN_PASSWORD env)' : '(auto-generated, not logged for security)'}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Admin creation failed:', error.message);
    if (process.env.NODE_ENV !== 'production') {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

seedAdmin();
