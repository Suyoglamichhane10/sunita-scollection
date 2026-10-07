const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-order-lifecycle-suite';
process.env.FRONTEND_URL = 'http://localhost:5173';

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../src/app');
const User = require('../src/Models/User');
const Order = require('../src/Models/Order');
const Product = require('../src/Models/Product');
const Payment = require('../src/Models/Payment');
const Delivery = require('../src/Models/Delivery');

let server;
let baseUrl;
let mongo;

const CUSTOMER = { name: 'Owner', email: 'owner@example.com', password: 'Pass12345' };
const OTHER = { name: 'Stranger', email: 'stranger@example.com', password: 'Pass12345' };
const ADMIN = { name: 'Boss', email: 'boss@example.com', password: 'Pass12345' };

const call = (method, pathname, { token, body } = {}) =>
  fetch(`${baseUrl}${pathname}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

const json = async (res) => ({ status: res.status, body: await res.json().catch(() => null) });

test.before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

const login = async (creds) => {
  const res = await json(await call('POST', '/api/auth/login', { body: creds }));
  return res.body.token;
};

let ownerToken;
let otherToken;
let adminToken;
let product;

test.before(async () => {
  const owner = await User.create(CUSTOMER);
  await User.create(OTHER);
  const admin = await User.create({ ...ADMIN, role: 'admin' });
  product = await Product.create({
    name: 'Silk Saree',
    description: 'Handwoven silk saree',
    category: new mongoose.Types.ObjectId(),
    price: 2500,
    stock: 10,
    soldCount: 0,
  });
  ownerToken = await login(CUSTOMER);
  otherToken = await login(OTHER);
  adminToken = await login({ email: admin.email, password: ADMIN.password });
  assert.ok(owner && otherToken && adminToken, 'fixtures should authenticate');
});

const makeOrder = async (owner, overrides = {}) =>
  Order.create({
    user: owner._id,
    items: [{ product: product._id, name: product.name, price: 2500, quantity: 2, total: 5000 }],
    subtotal: 5000,
    tax: 250,
    shippingCost: 0,
    totalAmount: 5250,
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    shippingAddress: {
      fullName: owner.name,
      phone: '9801234567',
      street: 'Test Street',
      city: 'Kathmandu',
      country: 'Nepal',
    },
    orderStatus: 'pending',
    statusHistory: [{ status: 'pending', note: 'created', updatedBy: owner._id }],
    stockDeducted: true,
    ...overrides,
  });

let owner;
let stranger;

test.beforeEach(async () => {
  owner = await User.findOne({ email: CUSTOMER.email });
  stranger = await User.findOne({ email: OTHER.email });
  await Order.deleteMany({});
  await Payment.deleteMany({});
  await Delivery.deleteMany({});
  await Product.updateOne({ _id: product._id }, { $set: { stock: 10, soldCount: 0 } });
});

test('a customer can cancel an order that is still active', async () => {
  for (const orderStatus of ['pending', 'confirmed', 'processing', 'packed']) {
    const order = await makeOrder(owner, { orderStatus });
    const res = await json(
      await call('PUT', `/api/orders/${order._id}/cancel`, {
        token: ownerToken,
        body: { reason: 'Changed my mind' },
      })
    );

    assert.equal(res.status, 200, `${orderStatus} should be cancellable`);
    assert.equal(res.body.order.orderStatus, 'cancelled');
    assert.ok(res.body.order.cancelledAt, 'cancelledAt must be recorded');
    assert.equal(res.body.order.cancellationReason, 'Changed my mind');
    assert.equal(
      res.body.order.statusHistory.at(-1).note,
      'Order cancelled by customer: Changed my mind'
    );
  }
});

test('a customer cannot cancel an order that has already left the warehouse', async () => {
  for (const orderStatus of ['shipped', 'delivered', 'cancelled']) {
    const order = await makeOrder(owner, { orderStatus });
    const res = await json(
      await call('PUT', `/api/orders/${order._id}/cancel`, { token: ownerToken, body: {} })
    );
    assert.equal(res.status, 400, `${orderStatus} must not be cancellable`);
  }
});

test('a customer cannot cancel somebody else\'s order', async () => {
  const order = await makeOrder(owner);
  const res = await json(
    await call('PUT', `/api/orders/${order._id}/cancel`, { token: otherToken, body: {} })
  );
  assert.equal(res.status, 403);
});

test('an admin can cancel an order on the customer\'s behalf', async () => {
  const order = await makeOrder(owner, { orderStatus: 'processing' });
  const res = await json(
    await call('PUT', `/api/orders/${order._id}/cancel`, {
      token: adminToken,
      body: { reason: 'Out of stock' },
    })
  );

  assert.equal(res.status, 200);
  assert.equal(res.body.order.orderStatus, 'cancelled');
  assert.equal(res.body.order.cancellationReason, 'Out of stock');
  assert.match(res.body.order.statusHistory.at(-1).note, /cancelled by admin/);
});

test('cancelling restores stock exactly once', async () => {
  const order = await makeOrder(owner);

  // Simulate the creation-time decrement that a COD order performs.
  await Product.updateOne({ _id: product._id }, { $inc: { stock: -2, soldCount: 2 } });
  assert.equal((await Product.findById(product._id)).stock, 8);

  const first = await json(
    await call('PUT', `/api/orders/${order._id}/cancel`, { token: ownerToken, body: {} })
  );
  assert.equal(first.status, 200);
  assert.equal((await Product.findById(product._id)).stock, 10, 'stock must come back');

  const second = await json(
    await call('PUT', `/api/orders/${order._id}/cancel`, { token: ownerToken, body: {} })
  );
  assert.equal(second.status, 400, 'a second cancel must be refused');
  assert.equal(
    (await Product.findById(product._id)).stock,
    10,
    'the refused second cancel must not restore stock again'
  );
});

test('cancelling a gateway order that never verified does not invent stock', async () => {
  const order = await makeOrder(owner, {
    paymentMethod: 'esewa',
    stockDeducted: false,
  });
  await Product.updateOne({ _id: product._id }, { $set: { stock: 10, soldCount: 0 } });

  const res = await json(
    await call('PUT', `/api/orders/${order._id}/cancel`, { token: ownerToken, body: {} })
  );

  assert.equal(res.status, 200);
  assert.equal(
    (await Product.findById(product._id)).stock,
    10,
    'stock was never taken, so it must not be given twice'
  );
});

test('a customer can delete a terminal order but not an active one', async () => {
  const deletable = await makeOrder(owner, { orderStatus: 'cancelled' });
  const okRes = await json(await call('DELETE', `/api/orders/${deletable._id}`, { token: ownerToken }));
  assert.equal(okRes.status, 200);
  assert.equal(await Order.findById(deletable._id), null);

  const delivered = await makeOrder(owner, { orderStatus: 'delivered' });
  assert.equal(
    (await json(await call('DELETE', `/api/orders/${delivered._id}`, { token: ownerToken }))).status,
    200
  );

  const failedPayment = await makeOrder(owner, {
    orderStatus: 'pending',
    paymentStatus: 'failed',
  });
  assert.equal(
    (await json(await call('DELETE', `/api/orders/${failedPayment._id}`, { token: ownerToken }))).status,
    200
  );
});

test('an active order must be cancelled before it can be deleted', async () => {
  const order = await makeOrder(owner, { orderStatus: 'processing' });
  const res = await json(await call('DELETE', `/api/orders/${order._id}`, { token: ownerToken }));

  assert.equal(res.status, 400);
  assert.match(res.body.message, /Cancel it first/);
  assert.ok(await Order.findById(order._id), 'the order must survive a refused delete');
});

test('a customer cannot delete somebody else\'s order', async () => {
  const order = await makeOrder(owner, { orderStatus: 'cancelled' });
  const res = await json(await call('DELETE', `/api/orders/${order._id}`, { token: otherToken }));

  assert.equal(res.status, 403);
  assert.ok(await Order.findById(order._id));
});

test('an admin can delete any terminal order', async () => {
  const order = await makeOrder(stranger, { orderStatus: 'delivered' });
  const res = await json(await call('DELETE', `/api/orders/${order._id}`, { token: adminToken }));

  assert.equal(res.status, 200);
  assert.equal(await Order.findById(order._id), null);
});

test('an admin still cannot delete an active order', async () => {
  const order = await makeOrder(owner, { orderStatus: 'packed' });
  const res = await json(await call('DELETE', `/api/orders/${order._id}`, { token: adminToken }));

  assert.equal(res.status, 400);
  assert.ok(await Order.findById(order._id));
});

test('deleting an order takes its payment, delivery and history entry with it', async () => {
  const order = await makeOrder(owner, { orderStatus: 'cancelled' });
  await Payment.create({
    orderId: order._id,
    userId: owner._id,
    amount: 5250,
    paymentMethod: 'cod',
    paymentStatus: 'failed',
  });
  await Delivery.create({ orderId: order._id, status: 'cancelled' });
  await User.updateOne({ _id: owner._id }, { $push: { orderHistory: order._id } });

  const res = await json(await call('DELETE', `/api/orders/${order._id}`, { token: ownerToken }));
  assert.equal(res.status, 200);

  assert.equal(await Payment.countDocuments({ orderId: order._id }), 0, 'payment must be removed');
  assert.equal(await Delivery.countDocuments({ orderId: order._id }), 0, 'delivery must be removed');

  const refreshed = await User.findById(owner._id);
  assert.ok(
    !refreshed.orderHistory.some((id) => id.toString() === order._id.toString()),
    'orderHistory must no longer reference the deleted order'
  );
});

test('unauthenticated requests cannot cancel or delete', async () => {
  const order = await makeOrder(owner, { orderStatus: 'pending' });
  assert.equal((await call('PUT', `/api/orders/${order._id}/cancel`, { body: {} })).status, 401);
  assert.equal((await call('DELETE', `/api/orders/${order._id}`)).status, 401);
});