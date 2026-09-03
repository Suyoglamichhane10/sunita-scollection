const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('../Models/Category');
const Product = require('../Models/Product');
const Slide = require('../Models/Slide');
const ChatbotIntent = require('../Models/ChatbotIntent');
const connectDB = require('../config/database');

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
    categoryName: 'Tops',
    images: [{ url: 'https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?w=500', isMain: true }],
    stock: 50,
    isActive: true,
    isFeatured: true,
    lowStockThreshold: 8,
    tags: ['top', 'crop top', 'casual'],
  },
  {
    name: 'Floral Maxi Dress',
    slug: 'floral-maxi-dress',
    description: 'Elegant floral maxi dress',
    price: 1499,
    categoryName: 'Dresses',
    images: [{ url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500', isMain: true }],
    stock: 30,
    isActive: true,
    isFeatured: true,
    lowStockThreshold: 5,
    tags: ['dress', 'maxi', 'floral'],
  },
  {
    name: 'White Sneakers',
    slug: 'white-sneakers',
    description: 'Comfortable white sneakers',
    price: 1999,
    categoryName: 'Footwear',
    images: [{ url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500', isMain: true }],
    stock: 40,
    isActive: true,
    isFeatured: true,
    lowStockThreshold: 7,
    tags: ['sneakers', 'footwear', 'casual'],
  },
  {
    name: 'Designer Handbag',
    slug: 'designer-handbag',
    description: 'Elegant designer handbag',
    price: 1299,
    categoryName: 'Accessories',
    images: [{ url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500', isMain: true }],
    stock: 25,
    isActive: true,
    isFeatured: true,
    lowStockThreshold: 5,
    tags: ['handbag', 'accessories', 'designer'],
  },
  {
    name: 'Gold Plated Earrings',
    slug: 'gold-earrings',
    description: 'Beautiful gold plated earrings',
    price: 599,
    categoryName: 'Jewelry',
    images: [{ url: 'https://images.unsplash.com/photo-1589674781759-21c0bb6f8d23?w=500', isMain: true }],
    stock: 100,
    isActive: true,
    isFeatured: false,
    lowStockThreshold: 10,
    tags: ['earrings', 'jewelry', 'gold'],
  },
];

const slides = [
  {
    imageUrl: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=1600&q=80',
    title: 'Elegance Redefined',
    subtitle: 'Discover curated collections for every occasion',
    buttonText: 'Shop Now',
    buttonLink: '/shop',
    order: 1,
    isActive: true,
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1600&q=80',
    title: 'New Arrivals',
    subtitle: 'Fresh styles have arrived — explore the latest trends',
    buttonText: 'See New Arrivals',
    buttonLink: '/shop?sort=newest',
    order: 2,
    isActive: true,
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1600&q=80',
    title: 'Footwear Collection',
    subtitle: 'Step into comfort and style with our latest footwear',
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
      { pattern: 'hey', language: 'both' },
      { pattern: 'namaste', language: 'both' },
    ],
    responses: {
      en: [
        'Hello! 👋 Welcome to Sunita\'s Collection. How can I help you today?',
        'Hi there! How can I assist you with our women\'s fashion collection?',
      ],
      ne: [
        'नमस्ते! 👋 सुनिता कलेक्सनमा स्वागत छ। म कसरी मद्दत गर्न सक्छु?',
        'नमस्कार! हामी कसरी तपाईंलाई सहयोग गर्न सक्छौं?',
      ],
    },
  },
  {
    intent: 'order_status',
    category: 'order_status',
    description: 'Check order status',
    priority: 9,
    patterns: [
      { pattern: 'where is my order', language: 'both' },
      { pattern: 'order status', language: 'both' },
      { pattern: 'track my order', language: 'both' },
      { pattern: 'my order', language: 'both' },
    ],
    responses: {
      en: ['Let me check your latest order status for you.'],
      ne: ['तपाईंको पछिल्लो अर्डरको स्थिति जाँच गर्दैछु।'],
    },
  },
  {
    intent: 'return_policy',
    category: 'return_policy',
    description: 'Return and exchange policy',
    priority: 7,
    patterns: [
      { pattern: 'return', language: 'both' },
      { pattern: 'exchange', language: 'both' },
      { pattern: 'return policy', language: 'both' },
      { pattern: 'refund', language: 'both' },
    ],
    responses: {
      en: [
        'We accept returns and exchanges within 7 days of delivery for items in original condition with tags attached. Refunds are processed within 5-7 business days after we receive the returned item.',
      ],
      ne: [
        'हामी डेलिभरी भएको ७ दिनभित्र मूल अवस्थामा रहेका वस्तुहरू फिर्ता वा साट्न सक्छौं। फिर्ता प्राप्त भएपछि ५-७ कार्यदिनभित्र रिफन्ड गरिन्छ।',
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
      { pattern: 'how long delivery', language: 'both' },
      { pattern: 'shipping cost', language: 'both' },
    ],
    responses: {
      en: [
        'We offer free delivery across Nepal on orders above Rs. 1,000. Standard delivery takes 3-5 business days. Same-day delivery is available in Kathmandu Valley on request.',
      ],
      ne: [
        'हामी रु. १,००० भन्दा बढीको अर्डरमा नेपालभर निःशुल्क डेलिभरी प्रदान गर्छौं। मानक डेलिभरी ३-५ कार्यदिन लाग्छ।',
      ],
    },
  },
  {
    intent: 'payment',
    category: 'payment',
    description: 'Payment methods',
    priority: 5,
    patterns: [
      { pattern: 'payment options', language: 'both' },
      { pattern: 'how to pay', language: 'both' },
      { pattern: 'payment method', language: 'both' },
      { pattern: 'cod', language: 'both' },
      { pattern: 'esewa', language: 'both' },
      { pattern: 'khalti', language: 'both' },
    ],
    responses: {
      en: [
        'We accept Cash on Delivery (COD), eSewa, Khalti, and credit/debit card payments via Stripe. All payments are secure.',
      ],
      ne: [
        'हामी क्यास अन डेलिभरी (COD), eSewa, Khalti र क्रेडिट/डेबिट कार्ड भुक्तानी स्वीकार गर्छौं। सबै भुक्तानी सुरक्षित छन्।',
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

const seedSlides = async () => {
  for (const slideData of slides) {
    const existing = await Slide.findOne({ title: slideData.title, order: slideData.order });
    if (existing) continue;
    await Slide.create(slideData);
    console.log(`🖼️  Slide created: ${slideData.title}`);
  }
};

async function seed() {
  try {
    await connectDB();

    // Create categories
    const categoryMap = {};
    for (const categoryData of categories) {
      const existing = await Category.findOne({ name: categoryData.name });
      if (!existing) {
        const category = await Category.create(categoryData);
        categoryMap[category.name] = category._id;
        console.log(`✅ Category created: ${category.name}`);
      } else {
        categoryMap[existing.name] = existing._id;
        console.log(`⏭️  Category already exists: ${existing.name}`);
      }
    }

    // Create products
    for (const productData of products) {
      const categoryId = categoryMap[productData.categoryName];
      if (!categoryId) continue;

      const existing = await Product.findOne({ slug: productData.slug });
      if (existing) {
        console.log(`⏭️  Product already exists: ${existing.name}`);
        continue;
      }

      const { categoryName, ...productPayload } = productData;
      const product = await Product.create({
        ...productPayload,
        category: categoryId,
      });
      console.log(`✅ Product created: ${product.name}`);
    }

    // Create slides
    await seedSlides();

    // Create chatbot intents
    await seedChatbotIntents();

    console.log('🎉 Seed data completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
