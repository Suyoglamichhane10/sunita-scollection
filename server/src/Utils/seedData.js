const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('../Models/Category');
const Product = require('../Models/Product');
const Slide = require('../Models/Slide');
const ChatbotIntent = require('../Models/ChatbotIntent');

dotenv.config();

const categories = [
  { name: 'Tops', slug: 'tops', description: 'Trendy tops for every style', order: 1 },
  { name: 'Dresses', slug: 'dresses', description: 'Beautiful dresses for any occasion', order: 2 },
  { name: 'Footwear', slug: 'footwear', description: 'Stylish footwear', order: 3 },
  { name: 'Accessories', slug: 'accessories', description: 'Complete your look', order: 4 },
  { name: 'Activewear', slug: 'activewear', description: 'Comfortable activewear', order: 5 },
  { name: 'Jewelry', slug: 'jewelry', description: 'Beautiful jewelry', order: 6 },
];

const products = [
  {
    name: 'Classic Crop Top',
    slug: 'classic-crop-top',
    description: 'Stylish crop top for casual wear',
    price: 899,
    comparePrice: 1299,
    categoryName: 'Tops',
    images: [
      { url: 'https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?w=500', isMain: true },
      { url: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500' },
    ],
    brand: 'Sunita\'s Collection',
    variants: [
      {
        title: 'White',
        sku: 'CROPTOP-WHT',
        attributes: { color: 'White' },
        price: 899,
        stock: 25,
        images: [{ url: 'https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?w=500', isMain: true }],
      },
      {
        title: 'Black',
        sku: 'CROPTOP-BLK',
        attributes: { color: 'Black' },
        price: 899,
        stock: 25,
        images: [{ url: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500', isMain: true }],
      },
    ],
    stock: 50,
    lowStockThreshold: 8,
    isActive: true,
    isFeatured: true,
    tags: ['top', 'crop top', 'casual'],
  },
  {
    name: 'Floral Maxi Dress',
    slug: 'floral-maxi-dress',
    description: 'Elegant floral maxi dress',
    price: 1499,
    comparePrice: 1999,
    categoryName: 'Dresses',
    images: [
      { url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500', isMain: true },
      { url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500' },
    ],
    brand: 'Sunita\'s Collection',
    stock: 30,
    lowStockThreshold: 5,
    isActive: true,
    isFeatured: true,
    tags: ['dress', 'maxi', 'floral'],
  },
  {
    name: 'White Sneakers',
    slug: 'white-sneakers',
    description: 'Comfortable white sneakers',
    price: 1999,
    comparePrice: 2499,
    categoryName: 'Footwear',
    images: [
      { url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500', isMain: true },
      { url: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=500' },
    ],
    brand: 'Sunita\'s Collection',
    stock: 40,
    lowStockThreshold: 7,
    isActive: true,
    isFeatured: true,
    tags: ['sneakers', 'footwear', 'casual'],
  },
  {
    name: 'Designer Handbag',
    slug: 'designer-handbag',
    description: 'Elegant designer handbag',
    price: 1299,
    comparePrice: 1699,
    categoryName: 'Accessories',
    images: [
      { url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500', isMain: true },
    ],
    brand: 'Sunita\'s Collection',
    stock: 25,
    lowStockThreshold: 5,
    isActive: true,
    isFeatured: true,
    tags: ['handbag', 'accessories'],
  },
  {
    name: 'Gold Plated Earrings',
    slug: 'gold-earrings',
    description: 'Beautiful gold plated earrings',
    price: 599,
    comparePrice: 799,
    categoryName: 'Jewelry',
    images: [
      { url: 'https://images.unsplash.com/photo-1589674781759-21c0bb6f8d23?w=500', isMain: true },
    ],
    brand: 'Sunita\'s Collection',
    stock: 100,
    lowStockThreshold: 10,
    isActive: true,
    tags: ['earrings', 'jewelry', 'gold'],
  },
];

const slides = [
  {
    title: 'Elegance Redefined',
    subtitle: 'Discover curated collections for every occasion',
    imageUrl: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=1600&q=80',
    buttonText: 'Shop Now',
    buttonLink: '/shop',
    order: 1,
    isActive: true,
  },
  {
    title: 'New Arrivals',
    subtitle: 'Fresh styles have arrived — explore the latest trends',
    imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1600&q=80',
    buttonText: 'See New Arrivals',
    buttonLink: '/shop?sort=newest',
    order: 2,
    isActive: true,
  },
  {
    title: 'Footwear Collection',
    subtitle: 'Step into comfort and style with our latest footwear',
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1600&q=80',
    buttonText: 'Shop Footwear',
    buttonLink: '/shop?category=Footwear',
    order: 3,
    isActive: true,
  },
];

const chatbotIntents = [
  {
    intent: 'greeting',
    category: 'greeting',
    description: 'Greet the customer',
    priority: 10,
    patterns: [
      { pattern: 'hello', language: 'both' },
      { pattern: 'hi', language: 'both' },
      { pattern: 'namaste', language: 'both' },
    ],
    responses: {
      en: [
        'Hello! 👋 Welcome to Sunita\'s Collection. How can I help you today?',
      ],
      ne: [
        'नमस्ते! 👋 सुनिता कलेक्सनमा स्वागत छ। म कसरी मद्दत गर्न सक्छु?',
      ],
    },
  },
  {
    intent: 'shipping',
    category: 'shipping',
    description: 'Shipping and delivery info',
    priority: 5,
    patterns: [
      { pattern: 'shipping', language: 'both' },
      { pattern: 'delivery', language: 'both' },
      { pattern: 'free delivery', language: 'both' },
    ],
    responses: {
      en: [
        'We offer free delivery across Nepal on orders above Rs. 1,000. Standard delivery takes 3-5 business days.',
      ],
      ne: [
        'हामी रु. १,००० भन्दा बढीको अर्डरमा नेपालभर निःशुल्क डेलिभरी प्रदान गर्छौं।',
      ],
    },
  },
  {
    intent: 'payment',
    category: 'payment',
    description: 'Payment methods',
    priority: 5,
    patterns: [
      { pattern: 'payment', language: 'both' },
      { pattern: 'cod', language: 'both' },
      { pattern: 'esewa', language: 'both' },
      { pattern: 'khalti', language: 'both' },
    ],
    responses: {
      en: [
        'We accept Cash on Delivery (COD), eSewa, Khalti, and credit/debit cards via Stripe.',
      ],
      ne: [
        'हामी क्यास अन डेलिभरी (COD), eSewa, Khalti र क्रेडिट/डेबिट कार्ड स्वीकार गर्छौं।',
      ],
    },
  },
];

const seedChatbotIntents = async () => {
  for (const intentData of chatbotIntents) {
    const existing = await ChatbotIntent.findOne({ intent: intentData.intent });
    if (existing) continue;
    await ChatbotIntent.create(intentData);
    console.log(`🤖 Chatbot intent created: ${intentData.intent}`);
  }
};

async function seed() {
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

    console.log('🗑️ Clearing existing data...');
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Slide.deleteMany({});
    await ChatbotIntent.deleteMany({});
    console.log('✅ Cleared existing data');

    console.log('📦 Inserting categories...');
    const insertedCategories = await Category.insertMany(categories);
    console.log(`✅ Added ${insertedCategories.length} categories`);
    for (const cat of insertedCategories) {
      console.log(`   - ${cat.name}`);
    }

    console.log('📦 Inserting products...');
    const productsWithCategories = products.map((p) => {
      const cat = insertedCategories.find((c) => c.name === p.categoryName);
      const { categoryName, ...rest } = p;
      return { ...rest, category: cat._id };
    });
    const insertedProducts = await Product.insertMany(productsWithCategories);
    console.log(`✅ Added ${insertedProducts.length} products`);
    for (const prod of insertedProducts) {
      console.log(`   - ${prod.name}`);
    }

    console.log('📦 Inserting slides...');
    const insertedSlides = await Slide.insertMany(slides);
    console.log(`✅ Added ${insertedSlides.length} slides`);

    console.log('📦 Inserting chatbot intents...');
    await seedChatbotIntents();

    console.log('🎉 Seed data completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    if (process.env.NODE_ENV !== 'production') {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

seed();
