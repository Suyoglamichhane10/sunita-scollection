const dotenv = require('dotenv');
const User = require('../Models/User');
const connectDB = require('../config/database');

dotenv.config();

async function seedAdmin() {
  try {
    await connectDB();

    const adminExists = await User.findOne({ email: 'admin@shopsync.com' });
    if (adminExists) {
      console.log('✅ Admin already exists');
      process.exit(0);
    }

    await User.create({
      name: 'Admin',
      email: 'admin@shopsync.com',
      password: 'Admin123!',
      role: 'admin',
      isEmailVerified: true,
    });

    console.log('✅ Admin created successfully!');
    console.log('📧 Email: admin@shopsync.com');
    console.log('🔑 Password: Admin123!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Admin creation failed:', error);
    process.exit(1);
  }
}

seedAdmin();
