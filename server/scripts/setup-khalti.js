#!/usr/bin/env node

/**
 * Interactive Khalti Setup Script
 * This script will:
 * 1. Check your current .env configuration
 * 2. Guide you through getting a Khalti test key
 * 3. Test the connection to Khalti
 * 4. Verify everything is working
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ENV_PATH = path.join(__dirname, '..', '.env');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

function loadEnvFile() {
  if (!fs.existsSync(ENV_PATH)) {
    return null;
  }
  const content = fs.readFileSync(ENV_PATH, 'utf8');
  const env = {};
  content.split('\n').forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      env[match[1].trim()] = match[2].trim();
    }
  });
  return env;
}

function isValidKhaltiSecret(secretKey) {
  if (!secretKey || typeof secretKey !== 'string') return false;
  const trimmed = secretKey.trim();
  if (/^your[_ ]?secret[_ ]?key/i.test(trimmed)) return false;
  if (trimmed.length < 32) return false;
  return true;
}

async function checkCurrentConfig() {
  log('\n=== Checking Current Configuration ===\n', 'cyan');

  const env = loadEnvFile();
  if (!env) {
    log('❌ .env file not found!', 'red');
    return false;
  }

  const secretKey = env.KHALTI_SECRET_KEY;
  const khaltiEnv = env.KHALTI_ENV || 'test';
  const baseUrl = env.KHALTI_BASE_URL;

  log(`KHALTI_ENV: ${khaltiEnv}`, 'blue');
  log(`KHALTI_BASE_URL: ${baseUrl || '(not set - using default)'}`, 'blue');
  log(`KHALTI_SECRET_KEY length: ${secretKey ? secretKey.length : 0}`, 'blue');
  log(`KHALTI_SECRET_KEY valid: ${isValidKhaltiSecret(secretKey) ? 'YES ✅' : 'NO ❌'}`, 
    isValidKhaltiSecret(secretKey) ? 'green' : 'red');

  if (secretKey) {
    log(`\nFirst 8 chars: ${secretKey.substring(0, 8)}...`, 'yellow');
    log(`Last 8 chars: ...${secretKey.substring(secretKey.length - 8)}`, 'yellow');
  }

  return isValidKhaltiSecret(secretKey);
}

async function guideToGetKey() {
  log('\n=== How to Get Your Khalti Test Secret Key ===\n', 'cyan');
  
  log('Step 1: Open your browser and go to:', 'yellow');
  log('   👉 https://merchant.khalti.com/', 'blue');
  
  log('\nStep 2: Sign up or Log in', 'yellow');
  log('   - If you don\'t have an account, click "Sign Up"', 'white');
  log('   - It\'s FREE for testing', 'white');
  log('   - If you have an account, just log in', 'white');
  
  log('\nStep 3: Get your Test Secret Key', 'yellow');
  log('   - Click on "Settings" (gear icon ⚙️)', 'white');
  log('   - Click on "API Keys" or "Integration"', 'white');
  log('   - Look for "Test Environment" section', 'white');
  log('   - Copy the "Test Secret Key"', 'white');
  log('   - It should be 32 characters long (like: a1b2c3d4e5f6...)', 'white');
  
  log('\nStep 4: Come back here and paste your key', 'yellow');
  
  const ready = await question('\nHave you signed up and have your test key ready? (yes/no): ');
  
  if (ready.toLowerCase() !== 'yes') {
    log('\n⚠️  No problem! Come back when you have your key.', 'yellow');
    log('   The app will still work with COD and eSewa payments.\n', 'white');
    rl.close();
    process.exit(0);
  }
}

async function updateEnvFile(newKey) {
  log('\n=== Updating .env File ===\n', 'cyan');
  
  if (!fs.existsSync(ENV_PATH)) {
    log('❌ .env file not found!', 'red');
    return false;
  }

  let content = fs.readFileSync(ENV_PATH, 'utf8');
  
  // Replace the KHALTI_SECRET_KEY line
  const regex = /^KHALTI_SECRET_KEY=.*$/m;
  if (regex.test(content)) {
    content = content.replace(regex, `KHALTI_SECRET_KEY=${newKey}`);
    fs.writeFileSync(ENV_PATH, content, 'utf8');
    log('✅ Updated KHALTI_SECRET_KEY in .env file', 'green');
    return true;
  } else {
    log('❌ Could not find KHALTI_SECRET_KEY in .env file', 'red');
    return false;
  }
}

async function testKhaltiConnection(secretKey) {
  log('\n=== Testing Khalti Connection ===\n', 'cyan');
  
  const isLive = process.env.KHALTI_ENV !== 'test';
  const baseUrl = process.env.KHALTI_BASE_URL || (isLive ? 'http://khalti.com/api/v2' : 'https://dev.khalti.com/api/v2');
  const gatewayUrl = `${baseUrl}/epayment/initiate/`;
  
  log(`Testing connection to: ${gatewayUrl}`, 'blue');
  
  const payload = {
    return_url: 'http://localhost:5173/order-success/demo',
    website_url: 'http://localhost:5173',
    amount: 10000, // 100 NPR in paisa
    purchase_order_id: 'TEST-' + Date.now(),
    purchase_order_name: "Sunita'z Collection Test",
    customer_info: { name: 'Test', email: 'test@example.com', phone: '9800000000' },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  
  try {
    const resp = await fetch(gatewayUrl, {
      method: 'POST',
      headers: { 
        Authorization: `Key ${secretKey}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    
    clearTimeout(timeout);
    const data = await resp.json();
    
    log(`\nHTTP Status: ${resp.status}`, resp.ok ? 'green' : 'red');
    
    if (resp.ok && data.payment_url) {
      log('✅ SUCCESS! Khalti accepted your key!', 'green');
      log(`   Payment URL generated: ${data.payment_url.substring(0, 50)}...`, 'cyan');
      return true;
    } else {
      log('❌ Khalti rejected the request', 'red');
      log(`   Reason: ${data.detail || data.message || 'Unknown error'}`, 'red');
      return false;
    }
  } catch (err) {
    clearTimeout(timeout);
    log('❌ Network error: Could not reach Khalti', 'red');
    log(`   Error: ${err.message}`, 'red');
    return false;
  }
}

async function main() {
  log('\n╔════════════════════════════════════════════════════════╗', 'cyan');
  log('║   Khalti Payment Gateway Setup Script                 ║', 'cyan');
  log('║   Sunita\'s Collection E-commerce Platform             ║', 'cyan');
  log('╚════════════════════════════════════════════════════════╝\n', 'cyan');

  // Step 1: Check current configuration
  const isValid = await checkCurrentConfig();
  
  if (isValid) {
    log('\n✅ Your Khalti configuration looks good!', 'green');
    log('   Testing connection to Khalti...\n', 'blue');
    
    const env = loadEnvFile();
    const testResult = await testKhaltiConnection(env.KHALTI_SECRET_KEY);
    
    if (testResult) {
      log('\n🎉 Everything is working perfectly!', 'green');
      log('   You can now use Khalti payments in your app.', 'green');
      log('   Restart your server if needed: npm run dev\n', 'yellow');
    } else {
      log('\n⚠️  The key format is valid but Khalti rejected it.', 'yellow');
      log('   Please check:', 'yellow');
      log('   1. You\'re using the TEST key (not LIVE key)', 'white');
      log('   2. Your Khalti merchant account is active', 'white');
      log('   3. KHALTI_ENV is set to "test" in .env', 'white');
    }
  } else {
    log('\n⚠️  Khalti is not configured yet.', 'yellow');
    log('   This is why you\'re seeing the error message.\n', 'white');
    
    const action = await question('Would you like to set up Khalti now? (yes/no): ');
    
    if (action.toLowerCase() === 'yes') {
      await guideToGetKey();
      
      log('\n=== Paste Your Test Secret Key ===\n', 'cyan');
      log('Paste your 32-character test secret key here:', 'yellow');
      log('(It should look like: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6)\n', 'white');
      
      const key = await question('Your test secret key: ');
      
      if (!key || key.length < 32) {
        log('\n❌ Invalid key! It must be at least 32 characters.', 'red');
        rl.close();
        process.exit(1);
      }
      
      const updated = await updateEnvFile(key.trim());
      
      if (updated) {
        log('\n✅ .env file updated successfully!', 'green');
        log('\n=== Next Steps ===\n', 'cyan');
        log('1. Restart your server:', 'yellow');
        log('   npm run dev', 'white');
        log('\n2. Test Khalti payment:', 'yellow');
        log('   - Phone: 9800000000', 'white');
        log('   - PIN: 111111', 'white');
        log('\n3. Or test with this script again:', 'yellow');
        log('   node scripts/setup-khalti.js', 'white');
        
        const testNow = await question('\nWould you like to test the connection now? (yes/no): ');
        
        if (testNow.toLowerCase() === 'yes') {
          const testResult = await testKhaltiConnection(key.trim());
          
          if (testResult) {
            log('\n🎉 Perfect! Khalti is now configured and working!', 'green');
          } else {
            log('\n⚠️  The key was saved but Khalti rejected it.', 'yellow');
            log('   Please verify:', 'yellow');
            log('   - You copied the complete key (32 characters)', 'white');
            log('   - You\'re using the TEST key, not LIVE key', 'white');
            log('   - Your merchant account is active', 'white');
          }
        }
      }
    } else {
      log('\n✅ No problem! You can:', 'green');
      log('   - Use COD (Cash on Delivery) - works perfectly', 'white');
      log('   - Use eSewa - works if configured', 'white');
      log('   - Run this script again later: node scripts/setup-khalti.js', 'white');
      log('   - Or manually add your key to server/.env\n', 'white');
    }
  }
  
  rl.close();
}

// Handle errors
process.on('unhandledRejection', (err) => {
  log(`\n❌ Error: ${err.message}`, 'red');
  rl.close();
  process.exit(1);
});

// Run the script
main().catch((err) => {
  log(`\n❌ Script failed: ${err.message}`, 'red');
  console.error(err);
  rl.close();
  process.exit(1);
});