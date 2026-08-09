const User = require('../Models/User');
const connectDB = require('../config/database');
const dotenv = require('dotenv');

dotenv.config();

const createAdminUser = async () => {
  await connectDB();

  const adminExists = await User.findOne({ email: 'admin@shopsync.com' });
  if (adminExists) {
    console.log('Admin user already exists');
    return { created: false, reason: 'exists' };
  }

  const admin = await User.create({
    name: 'Admin',
    email: 'admin@shopsync.com',
    password: 'Admin123!',
    phone: '9800000000',
    role: 'admin',
    isEmailVerified: true,
  });

  console.log('✅ Admin user created successfully');
  console.log(`📧 Email: ${admin.email}`);
  console.log(`🔑 Password: Admin123!`);
  return { created: true, user: admin };
};

if (require.main === module) {
  createAdminUser()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(`❌ Error: ${err.message}`);
      process.exit(1);
    });
}

module.exports = { createAdminUser };
