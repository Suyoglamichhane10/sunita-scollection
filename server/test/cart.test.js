const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-cart-suite';
process.env.FRONTEND_URL = 'http://localhost:5173';

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../src/app');
const User = require('../src/Models/User');
const Product = require('../src/Models/Product');

let server;
let baseUrl;
let mongo;
let token;
let product;

const call = (method, pathname, body) =>
  fetch(`${baseUrl}${pathname}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

const json = async (res) => ({ status: res.status, body: await res.json().catch(() => null) });

test.before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  const user = await User.create({
    name: 'Cart Tester',
    email: 'cart@example.com',
    password: 'Pass12345',
  });
  product = await Product.create({
    name: 'Kurti',
    description: 'Cotton kurti',
    category: new mongoose.Types.ObjectId(),
    price: 1200,
    stock: 10,
    soldCount: 0,
  });

  const login = await json(
    await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'cart@example.com', password: 'Pass12345' }),
    })
  );
  token = login.body.token;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

test('GET cart starts empty', async () => {
  const res = await json(await call('GET', '/api/users/profile/cart'));
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.cart, []);
});

test('POST cart adds a product exactly the way the Home page does', async () => {
  const res = await json(
    await call('POST', '/api/users/profile/cart', {
      productId: product._id.toString(),
      quantity: 1,
      variantSku: null,
      dealPrice: null,
    })
  );

  assert.equal(res.status, 200, `add to cart failed: ${JSON.stringify(res.body)}`);
  assert.equal(res.body.cart.length, 1);
  assert.equal(res.body.cart[0].quantity, 1);
  assert.equal(res.body.cart[0].product._id, product._id.toString());
});

test('GET cart still works after an item was added', async () => {
  const res = await json(await call('GET', '/api/users/profile/cart'));
  assert.equal(res.status, 200, `loading the cart failed: ${JSON.stringify(res.body)}`);
  assert.equal(res.body.cart.length, 1);
});

test('adding the same product twice merges quantity', async () => {
  await call('POST', '/api/users/profile/cart', {
    productId: product._id.toString(),
    quantity: 2,
    variantSku: null,
    dealPrice: null,
  });
  const res = await json(await call('GET', '/api/users/profile/cart'));
  assert.equal(res.body.cart.length, 1, 'rows must be consolidated');
  assert.equal(res.body.cart[0].quantity, 3, '1 from the previous test plus 2');
});

test('ProductCard variant path: selectedVariant.sku adds and merges per variant', async () => {
  const variantProduct = await Product.create({
    name: 'Variant Kurti',
    description: 'Kurti with variants',
    category: new mongoose.Types.ObjectId(),
    price: 1500,
    stock: 10,
    soldCount: 0,
    variants: [
      { sku: 'RED-S', stock: 4, price: 1500, attributes: { color: 'Red', size: 'S' } },
      { sku: 'BLUE-M', stock: 2, price: 1600, attributes: { color: 'Blue', size: 'M' } },
    ],
  });

  const add = async (variantSku, quantity) =>
    json(
      await call('POST', '/api/users/profile/cart', {
        productId: variantProduct._id.toString(),
        quantity,
        variantSku,
        dealPrice: undefined,
      })
    );

  const first = await add('RED-S', 1);
  assert.equal(first.status, 200, `variant add failed: ${JSON.stringify(first.body)}`);

  const same = await add('RED-S', 2);
  assert.equal(same.status, 200);
  const redRows = same.body.cart.filter((i) => i.variantSku === 'RED-S');
  assert.equal(redRows.length, 1, 'same variant must merge into one row');
  assert.equal(redRows[0].quantity, 3);

  const other = await add('BLUE-M', 1);
  assert.equal(other.status, 200);
  assert.equal(other.body.cart.filter((i) => i.product._id === variantProduct._id.toString()).length, 2);

  const capped = await add('BLUE-M', 5);
  assert.equal(capped.status, 400, 'variant stock limit must be enforced');
  assert.match(capped.body.message, /Insufficient stock \(max 2\)/);

  const unknown = await add('NOPE', 1);
  assert.equal(unknown.status, 400);
  assert.match(unknown.body.message, /Variant not found/);
});

test('quantity cannot exceed stock', async () => {
  const res = await json(
    await call('POST', '/api/users/profile/cart', {
      productId: product._id.toString(),
      quantity: 99,
      variantSku: null,
      dealPrice: null,
    })
  );
  assert.equal(res.status, 400);
  assert.match(res.body.message, /Insufficient stock/);
});

test('removeFromCart then clearCart work', async () => {
  const listed = await json(await call('GET', '/api/users/profile/cart'));
  assert.ok(listed.body.cart.length > 0, 'cart must not be empty before removal');

  let remaining = listed.body.cart;
  for (const item of listed.body.cart) {
    const key = item.variantSku ? `${item.product._id}:${item.variantSku}` : item.product._id;
    const removed = await json(await call('DELETE', `/api/users/profile/cart/${key}`));
    assert.equal(removed.status, 200);
    remaining = removed.body.cart;
  }

  assert.equal(remaining.length, 0, 'every row must be removable by its product[:variant] key');
});