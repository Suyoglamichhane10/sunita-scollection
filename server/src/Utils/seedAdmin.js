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
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@shopsync.com',
      password: 'Admin123!',
      role: 'admin',
      isEmailVerified: true,
      phone: '9800000000',
    });

    console.log('✅ Admin created successfully!');
    console.log(`📧 Email: ${admin.email}`);
    console.log(`🔑 Password: Admin123!`);
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
