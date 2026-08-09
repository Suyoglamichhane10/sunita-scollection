const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('../Models/Category');
const Product = require('../Models/Product');
const ChatbotIntent = require('../Models/ChatbotIntent');
const connectDB = require('../config/database');

dotenv.config();

const categories = [
  {
    name: 'Sarees',
    description: 'Graceful sarees tailored for festivals, parties, and daily elegance.',
    image: { url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80' },
    order: 1,
  },
  {
    name: 'Bags',
    description: 'Stylish bags and clutches made for her busy days and special nights.',
    image: { url: 'https://images.unsplash.com/photo-1520962911832-6c1cf762c06f?auto=format&fit=crop&w=600&q=80' },
    order: 2,
  },
  {
    name: 'Sandals',
    description: 'Soft, fashionable sandals designed for comfort without compromising style.',
    image: { url: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=600&q=80' },
    order: 3,
  },
  {
    name: 'Earrings',
    description: 'Delicate earrings that add subtle sparkle to every look.',
    image: { url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80' },
    order: 4,
  },
  {
    name: 'Necklaces',
    description: 'Elegant necklaces designed to enhance every outfit.',
    image: { url: 'https://images.unsplash.com/photo-1549576490-b0b4831ef60a?auto=format&fit=crop&w=600&q=80' },
    order: 5,
  },
];

const products = [
  {
    name: 'Silk Saree Set',
    categoryName: 'Sarees',
    description: 'Luxurious silk saree with intricate borders, perfect for festivals and weddings. Comes with matching blouse piece.',
    price: 4299,
    comparePrice: 5200,
    stock: 25,
    lowStockThreshold: 5,
    isFeatured: true,
    images: [
      { url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80', isMain: true },
      { url: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=600&q=80' },
      { url: 'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?auto=format&fit=crop&w=600&q=80' },
    ],
    variants: [
      { title: 'Red', sku: 'SAREE-SILK-RED', attributes: { color: 'Red' }, price: 4299, stock: 10, images: [{ url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80', isMain: true }] },
      { title: 'Blue', sku: 'SAREE-SILK-BLUE', attributes: { color: 'Blue' }, price: 4499, stock: 8, images: [{ url: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=600&q=80', isMain: true }] },
      { title: 'Green', sku: 'SAREE-SILK-GREEN', attributes: { color: 'Green' }, price: 4399, stock: 7, images: [{ url: 'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?auto=format&fit=crop&w=600&q=80', isMain: true }] },
    ],
    tags: ['saree', 'silk', 'festival', 'wedding'],
  },
{
    name: 'Designer Sling Bag',
    categoryName: 'Bags',
    description: 'Chic designer sling bag with elegant detailing. Perfect for daily use and special occasions.',
    price: 2199,
    comparePrice: 2600,
    stock: 30,
    lowStockThreshold: 5,
    isFeatured: true,
    images: [
      { url: 'https://images.unsplash.com/photo-1520962911832-6c1cf762c06f?auto=format&fit=crop&w=600&q=80', isMain: true },
      { url: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=600&q=80' },
    ],
    variants: [
      { title: 'Black', sku: 'BAG-SLING-BLACK', attributes: { color: 'Black' }, price: 2199, stock: 12, images: [{ url: 'https://images.unsplash.com/photo-1520962911832-6c1cf762c06f?auto=format&fit=crop&w=600&q=80', isMain: true }] },
      { title: 'Tan', sku: 'BAG-SLING-TAN', attributes: { color: 'Tan' }, price: 2299, stock: 10, images: [{ url: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=600&q=80', isMain: true }] },
    ],
    tags: ['bag', 'sling', 'designer'],
  },
{
    name: 'Embellished Sandals',
    categoryName: 'Sandals',
    description: 'Beautifully embellished sandals for comfort and style. Soft sole and elegant design.',
    price: 1799,
    comparePrice: 2200,
    stock: 20,
    lowStockThreshold: 5,
    isFeatured: true,
    images: [
      { url: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=600&q=80', isMain: true },
      { url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=600&q=80' },
    ],
    variants: [
      { title: 'Size 6', sku: 'SANDAL-EMB-6', attributes: { size: '6' }, price: 1799, stock: 6, images: [{ url: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=600&q=80', isMain: true }] },
      { title: 'Size 7', sku: 'SANDAL-EMB-7', attributes: { size: '7' }, price: 1799, stock: 7, images: [{ url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=600&q=80', isMain: true }] },
      { title: 'Size 8', sku: 'SANDAL-EMB-8', attributes: { size: '8' }, price: 1899, stock: 7, images: [{ url: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=600&q=80', isMain: true }] },
    ],
    tags: ['sandals', 'footwear', 'embellished'],
  },
{
    name: 'Gold Plated Necklace',
    categoryName: 'Necklaces',
    description: 'Elegant gold plated necklace with intricate design. Adds sparkle to any outfit.',
    price: 1499,
    comparePrice: 1800,
    stock: 40,
    lowStockThreshold: 8,
    isFeatured: true,
    images: [
      { url: 'https://images.unsplash.com/photo-1549576490-b0b4831ef60a?auto=format&fit=crop&w=600&q=80', isMain: true },
      { url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80' },
    ],
    variants: [
      { title: 'Gold', sku: 'NECK-GOLD-STD', attributes: { color: 'Gold' }, price: 1499, stock: 20, images: [{ url: 'https://images.unsplash.com/photo-1549576490-b0b4831ef60a?auto=format&fit=crop&w=600&q=80', isMain: true }] },
      { title: 'Rose Gold', sku: 'NECK-ROSE-STD', attributes: { color: 'Rose Gold' }, price: 1599, stock: 20, images: [{ url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80', isMain: true }] },
    ],
    tags: ['necklace', 'gold', 'jewelry'],
  },
{
    name: 'Pearl Drop Earrings',
    categoryName: 'Earrings',
    description: 'Elegant pearl drop earrings perfect for parties and formal events.',
    price: 899,
    comparePrice: 1200,
    stock: 35,
    lowStockThreshold: 8,
    isFeatured: true,
    images: [
      { url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80', isMain: true },
      { url: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=600&q=80' },
    ],
    variants: [
      { title: 'White Pearl', sku: 'EARR-PEARL-W', attributes: { color: 'White' }, price: 899, stock: 18, images: [{ url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80', isMain: true }] },
      { title: 'Pink Pearl', sku: 'EARR-PEARL-P', attributes: { color: 'Pink' }, price: 949, stock: 17, images: [{ url: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=600&q=80', isMain: true }] },
    ],
    tags: ['earrings', 'pearl', 'party'],
  },
{
    name: 'Cotton Saree - Daily Wear',
    categoryName: 'Sarees',
    description: 'Breathable cotton saree perfect for daily wear and office. Lightweight and comfortable.',
    price: 1899,
    comparePrice: 2400,
    stock: 28,
    lowStockThreshold: 5,
    isFeatured: false,
    images: [
      { url: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=600&q=80', isMain: true },
      { url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80' },
    ],
    variants: [
      { title: 'Printed', sku: 'SAREE-COTTON-PRINT', attributes: { pattern: 'Printed' }, price: 1899, stock: 15, images: [{ url: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=600&q=80', isMain: true }] },
      { title: 'Solid', sku: 'SAREE-COTTON-SOLID', attributes: { pattern: 'Solid' }, price: 1999, stock: 13, images: [{ url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80', isMain: true }] },
    ],
    tags: ['saree', 'cotton', 'daily'],
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
      { pattern: 'नमस्ते', language: 'ne' },
      { pattern: 'नमस्कार', language: 'ne' },
      { pattern: 'good morning', language: 'en' },
      { pattern: 'good evening', language: 'en' },
    ],
    responses: {
      en: [
        'Hello! 👋 Welcome to Sunita\u2019s Collection. How can I help you today?',
        'Hi there! How can I assist you with our women\u2019s fashion collection?',
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
      { pattern: 'order progress', language: 'both' },
      { pattern: 'मेरो अर्डर', language: 'ne' },
      { pattern: 'अर्डरको स्थिति', language: 'ne' },
      { pattern: 'अर्डर कहाँ छ', language: 'ne' },
    ],
    responses: {
      en: ['Let me check your latest order status for you.'],
      ne: ['तपाईंको पछिल्लो अर्डरको स्थिति जाँच गर्दैछु।'],
    },
  },
  {
    intent: 'product_recommendation',
    category: 'product_recommendation',
    description: 'Product recommendations',
    priority: 8,
    patterns: [
      { pattern: 'recommend', language: 'both' },
      { pattern: 'suggest', language: 'both' },
      { pattern: 'what should i buy', language: 'both' },
      { pattern: 'recommendation', language: 'both' },
      { pattern: 'what do you recommend', language: 'both' },
      { pattern: 'के किन्दा राम्रो', language: 'ne' },
      { pattern: 'सिफारिस', language: 'ne' },
    ],
    responses: {
      en: ['Let me find some great products for you based on your preferences.'],
      ne: ['तपाईंको मनपर्ने अनुसार उत्तम उत्पादनहरू खोज्दैछु।'],
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
      { pattern: 'फिर्ता', language: 'ne' },
      { pattern: 'रिटर्न', language: 'ne' },
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
    intent: 'store_hours',
    category: 'store_hours',
    description: 'Store operating hours',
    priority: 6,
    patterns: [
      { pattern: 'store hours', language: 'both' },
      { pattern: 'open hours', language: 'both' },
      { pattern: 'when are you open', language: 'both' },
      { pattern: 'opening time', language: 'both' },
      { pattern: 'खुल्ने समय', language: 'ne' },
      { pattern: 'पसल कहिले खुल्छ', language: 'ne' },
    ],
    responses: {
      en: [
        'Our online store is open 24/7! 🌟 For in-person support, our team is available Monday to Saturday, 9 AM to 7 PM Nepal Time. You can also reach us anytime through our live chat.',
      ],
      ne: [
        'हाम्रो अनलाइन पसल २४/७ खुला छ! 🌟 सहयोगको लागि हाम्रो टोली सोमबारदेखि शनिबार, बिहान ९ बजेदेखि साँझ ७ बजेसम्म नेपाली समयमा उपलब्ध छ। तपाईं हाम्रो लाइभ च्याटबाट पनि सम्पर्क गर्न सक्नुहुन्छ।',
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
      { pattern: 'डेलिभरी', language: 'ne' },
      { pattern: 'डिस्प्याच', language: 'ne' },
    ],
    responses: {
      en: [
        'We offer free delivery across Nepal on orders above Rs. 1,000. Standard delivery takes 3-5 business days. Same-day delivery is available in Kathmandu Valley on request.',
      ],
      ne: [
        'हामी रु. १,००० भन्दा बढीको अर्डरमा नेपालभर निःशुल्क डेलिभरी प्रदान गर्छौं। मानक डेलिभरी ३-५ कार्यदिन लाग्छ। काठमाडौं उपत्यकामा सोही दिनको डेलिभरी पनि उपलब्ध छ।',
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
      { pattern: 'भुक्तानी', language: 'ne' },
      { pattern: 'कसरी पैसा तिर्ने', language: 'ne' },
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
  {
    intent: 'contact',
    category: 'contact',
    description: 'Contact human support',
    priority: 4,
    patterns: [
      { pattern: 'talk to human', language: 'both' },
      { pattern: 'human agent', language: 'both' },
      { pattern: 'customer service', language: 'both' },
      { pattern: 'speak to someone', language: 'both' },
      { pattern: 'मानव एजेन्ट', language: 'ne' },
      { pattern: 'ग्राहक सेवा', language: 'ne' },
    ],
    responses: {
      en: ['Of course! I will connect you with a human agent who can assist you further.'],
      ne: ['निश्चित रूपमा! म तपाईंलाई थप सहयोग गर्न मानव एजेन्टसँग जोड्दैछु।'],
    },
    escalateToHuman: true,
  },
  {
    intent: 'loyalty',
    category: 'loyalty',
    description: 'Loyalty program info',
    priority: 4,
    patterns: [
      { pattern: 'loyalty points', language: 'both' },
      { pattern: 'my points', language: 'both' },
      { pattern: 'reward points', language: 'both' },
      { pattern: 'loyalty program', language: 'both' },
      { pattern: 'मेरो अंक', language: 'ne' },
      { pattern: 'लोयल्टी', language: 'ne' },
    ],
    responses: {
      en: ['Let me check your loyalty points and rewards.'],
      ne: ['तपाईंको लोयल्टी अंक र पुरस्कारहरू जाँच गर्दैछु।'],
    },
  },
  {
    intent: 'thanks',
    category: 'thanks',
    description: 'Thank you responses',
    priority: 3,
    patterns: [
      { pattern: 'thank you', language: 'both' },
      { pattern: 'thanks', language: 'both' },
      { pattern: 'thankyou', language: 'both' },
      { pattern: 'धन्यवाद', language: 'ne' },
    ],
    responses: {
      en: ['You\u2019re very welcome! 💖 Is there anything else I can help you with?'],
      ne: ['तपाईंको स्वागत छ! 💖 के अरु केहि सहयोग गर्न सक्छु?'],
    },
  },
  {
    intent: 'farewell',
    category: 'farewell',
    description: 'Goodbye responses',
    priority: 3,
    patterns: [
      { pattern: 'bye', language: 'both' },
      { pattern: 'goodbye', language: 'both' },
      { pattern: 'see you', language: 'both' },
      { pattern: 'बिदा', language: 'ne' },
      { pattern: 'अलविदा', language: 'ne' },
    ],
    responses: {
      en: ['Goodbye! Thank you for visiting Sunita\u2019s Collection. Have a wonderful day! 👋'],
      ne: ['बिदा! सुनिता कलेक्सनमा भेट्नुभएकोमा धन्यवाद। तपाईंको दिन शुभ रहोस्! 👋'],
    },
  },
  {
    intent: 'help',
    category: 'help',
    description: 'General help',
    priority: 2,
    patterns: [
      { pattern: 'help', language: 'both' },
      { pattern: 'assist', language: 'both' },
      { pattern: 'support', language: 'both' },
      { pattern: 'मद्दत', language: 'ne' },
      { pattern: 'सहयोग', language: 'ne' },
    ],
    responses: {
      en: [
        'I can help you with order status, product recommendations, returns, shipping, payments, store hours, and more. Just ask me anything!',
      ],
      ne: [
        'म तपाईंलाई अर्डर स्थिति, उत्पादन सिफारिस, फिर्ता, डेलिभरी, भुक्तानी, पसलको समय र थप कुराहरूमा मद्दत गर्न सक्छु। केहि सोध्नुहोस्!',
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

const seedData = async () => {
  await connectDB();

  // Create chatbot intents
  await seedChatbotIntents();

  // Create categories
  const categoryMap = {};
  for (const categoryData of categories) {
    const existing = await Category.findOne({ name: categoryData.name });
    if (existing) {
      categoryMap[existing.name] = existing._id;
      continue;
    }
    const category = await Category.create(categoryData);
    categoryMap[category.name] = category._id;
    console.log(`✅ Category created: ${category.name}`);
  }

  // Create products
  for (const productData of products) {
    const categoryName = productData.categoryName;
    const categoryId = categoryMap[categoryName];
    if (!categoryId) continue;

    const existing = await Product.findOne({ sku: productData.variants?.[0]?.sku || productData.name });
    if (existing) continue;

    const { categoryName: _x, ...productPayload } = productData;
    const product = await Product.create({
      ...productPayload,
      category: categoryId,
    });
    console.log(`✅ Product created: ${product.name}`);
  }

  console.log('🎉 Seed data completed successfully!');
  process.exit(0);
};

if (require.main === module) {
  seedData().catch((err) => {
    console.error(`❌ Seed failed: ${err.message}`);
    process.exit(1);
  });
}
