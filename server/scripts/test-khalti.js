/**
 * Self-contained Khalti integration test.
 * 1) Verifies the secret-key validation logic (same as paymentController).
 * 2) Calls Khalti's real dev API with the current .env placeholder key to show
 *    the actual gateway behavior, and (if a real key is present) demonstrates
 *    a full initiate flow.
 *
 * Run: node scripts/test-khalti.js
 */
const fs = require('fs');
const path = require('path');

// ---- Replicate the exact validation logic from paymentController.js ----
const isValidKhaltiSecret = (secretKey) => {
  if (!secretKey || typeof secretKey !== 'string') return false;
  const trimmed = secretKey.trim();
  if (/^your[_ ]?secret[_ ]?key/i.test(trimmed)) return false;
  if (trimmed.length < 32) return false;
  return true;
};

// ---- Load secretKey from .env without exposing it ----
function loadEnvKey() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return null;
  const content = fs.readFileSync(envPath, 'utf8');
  const m = content.match(/^KHALTI_SECRET_KEY=(.*)$/m);
  if (!m) return null;
  const v = m[1].trim();
  return v.length ? v : null;
}

const DEFAULT_FRONTEND_URL = 'http://localhost:5173';

async function main() {
  const secretKey = loadEnvKey();
  const isLive = process.env.KHALTI_ENV !== 'test';
  const baseUrl = process.env.KHALTI_BASE_URL || (isLive ? 'http://khalti.com/api/v2' : 'https://dev.khalti.com/api/v2');
  const gatewayUrl = `${baseUrl}/epayment/initiate/`;

  console.log('=== KHALTI INTEGRATION TEST ===\n');
  console.log('KHALTI_ENV     :', process.env.KHALTI_ENV || '(not set -> treats as live)');
  console.log('Gateway URL    :', gatewayUrl);
  console.log('Secret key len :', secretKey ? secretKey.length : '(missing)');
  console.log('Secret valid?  :', isValidKhaltiSecret(secretKey));
  console.log('');

  if (!isValidKhaltiSecret(secretKey)) {
    console.log('RESULT: FAIL (config)');
    console.log('The KHALTI_SECRET_KEY in .env is missing/invalid (placeholder or <32 chars).');
    console.log('This is the root cause of "Authentication credentials were not provided".');
    console.log('Fix: replace KHALTI_SECRET_KEY in server/.env with a real 32-char test key');
    console.log('     from https://khalti.com/ (Settings > API Keys) and set KHALTI_ENV=test.\n');
    return;
  }

  // ---- Real key present: attempt a genuine initiate call ----
  const payload = {
    return_url: `${DEFAULT_FRONTEND_URL}/order-success/demo`,
    website_url: DEFAULT_FRONTEND_URL,
    amount: 10000, // 100.00 NPR in paisa
    purchase_order_id: 'TEST-ORDER-' + Date.now(),
    purchase_order_name: 'Sunita\'s Collection Test',
    customer_info: { name: 'Test', email: 'test@example.com', phone: '9800000000' },
  };

  console.log('Attempting real initiate call to Khalti dev API...\n');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const resp = await fetch(gatewayUrl, {
      method: 'POST',
      headers: { Authorization: `Key ${secretKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const data = await resp.json();
    console.log('HTTP status     :', resp.status);
    console.log('Gateway response:', JSON.stringify(data, null, 2));
    console.log('');
    if (resp.ok && data.payment_url) {
      console.log('RESULT: PASS — Khalti accepted the request. Payment URL:', data.payment_url);
    } else {
      console.log('RESULT: FAIL — Khalti rejected the request.');
      console.log('Reason:', data.detail || data.message || 'unknown');
    }
  } catch (err) {
    console.log('Network error   :', err.message);
    console.log('RESULT: FAIL — could not reach Khalti gateway.');
  } finally {
    clearTimeout(timeout);
  }
}

main().catch((e) => {
  console.error('Test crashed:', e);
  process.exitCode = 1;
});
