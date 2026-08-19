const mongoose = require('mongoose');
const Product = require('../src/Models/Product');

const createSearchIndex = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sunita-scollection');
    console.log('Connected to MongoDB');

    // Create text index
    console.log('Creating text index for search functionality...');
    await Product.collection.createIndex(
      { name: 'text', description: 'text', brand: 'text', category: 'text' },
      {
        name: 'SearchIndex',
        weights: {
          name: 10,
          brand: 5,
          description: 3,
          category: 2
        }
      }
    );

    console.log('✅ Text index created successfully!');
    console.log('Search functionality is now enabled for: name, description, brand, and category fields');

    // Close connection
    await mongoose.connection.close();
    console.log('Connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating index:', error);
    process.exit(1);
  }
};

createSearchIndex();