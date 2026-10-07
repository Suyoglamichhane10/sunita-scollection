const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const path = require('node:path');
const crypto = require('node:crypto');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-password-reset-suite';
process.env.FRONTEND_URL = 'https://sunitacollection-frontend.vercel.app,http://localhost:5173';

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Stub the mailer before authController is loaded: the controller destructures
// sendPasswordReset at require time, so patching the module first is the only
// way to exercise the happy path without real SMTP credentials.
const emailService = require('../src/services/emailService');

const mail = { delivered: [], shouldFail: false, lastUrl: null };

emailService.sendPasswordReset = async (user, resetUrl) => {
  mail.lastUrl = resetUrl;
  if (mail.shouldFail) {
    return { success: false, message: 'simulated SMTP failure' };
  }
  mail.delivered.push({ to: user.email, url: resetUrl });
  return { success: true };
};

const app = require('../src/app');
const User = require('../src/Models/User');

let server;
let baseUrl;
let mongo;

const post = (pathname, body, headers = {}) =>
  fetch(`${baseUrl}${pathname}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });

const put = (pathname, body, headers = {}) =>
  fetch(`${baseUrl}${pathname}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });

const login = async (email, password) => {
  const res = await post('/api/auth/login', { email, password });
  return { status: res.status, body: await res.json() };
};

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

test.beforeEach(async () => {
  mail.delivered = [];
  mail.shouldFail = false;
  mail.lastUrl = null;
  await User.deleteMany({});
  await User.create({
    name: 'Reset Tester',
    email: 'reset.tester@example.com',
    password: 'OriginalPass123',
  });
});

test('forgot-password never reveals whether an account exists', async () => {
  const known = await post('/api/auth/forgot-password', { email: 'reset.tester@example.com' });
  const knownBody = await known.json();
  const unknown = await post('/api/auth/forgot-password', { email: 'nobody@example.com' });
  const unknownBody = await unknown.json();

  assert.equal(known.status, 200);
  assert.equal(unknown.status, 200, 'an unknown address must not be distinguishable');
  assert.equal(knownBody.message, unknownBody.message);
});

test('forgot-password response does not leak the reset token or URL', async () => {
  const res = await post('/api/auth/forgot-password', { email: 'reset.tester@example.com' });
  const body = await res.json();

  assert.equal(body.resetToken, undefined);
  assert.equal(body.resetUrl, undefined);
});

test('forgot-password stores a hashed token and emails a link to the requesting origin', async () => {
  const res = await post(
    '/api/auth/forgot-password',
    { email: 'reset.tester@example.com' },
    { Origin: 'http://localhost:5173' }
  );
  assert.equal(res.status, 200);

  const user = await User.findOne({ email: 'reset.tester@example.com' }).select(
    '+resetPasswordToken +resetPasswordExpire'
  );
  assert.ok(user.resetPasswordToken, 'token must be persisted');
  assert.ok(user.resetPasswordExpire > Date.now(), 'token must have a future expiry');

  const rawToken = mail.lastUrl.split('/').pop();
  assert.equal(
    user.resetPasswordToken,
    crypto.createHash('sha256').update(rawToken).digest('hex'),
    'the stored token must be the sha256 of the emailed token, not the token itself'
  );

  assert.equal(
    mail.lastUrl,
    `http://localhost:5173/reset-password/${rawToken}`,
    'the link must use the origin the request came from'
  );
});

test('an untrusted origin never reaches the mailer', async () => {
  const res = await post(
    '/api/auth/forgot-password',
    { email: 'reset.tester@example.com' },
    { Origin: 'https://attacker.example' }
  );

  assert.notEqual(res.status, 200, 'CORS must reject an origin that is not configured');
  assert.equal(mail.lastUrl, null, 'no reset link may be minted for an untrusted origin');
  assert.equal(mail.delivered.length, 0);
});

test('a request with no Origin header uses the default frontend URL', async () => {
  const res = await post('/api/auth/forgot-password', { email: 'reset.tester@example.com' });
  assert.equal(res.status, 200);
  assert.ok(
    mail.lastUrl.startsWith('https://sunitacollection-frontend.vercel.app/reset-password/'),
    `unexpected link host: ${mail.lastUrl}`
  );
});

test('forgot-password reports a mail failure instead of a false success', async () => {
  mail.shouldFail = true;
  const res = await post('/api/auth/forgot-password', { email: 'reset.tester@example.com' });
  const body = await res.json();

  assert.equal(res.status, 503);
  assert.equal(body.success, false);
});

test('reset-password changes the password and clears the token', async () => {
  const rawToken = await requestResetToken('reset.tester@example.com');

  const res = await put(`/api/auth/reset-password/${rawToken}`, { password: 'BrandNewPass456' });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.token, undefined, 'reset must not hand out a session');

  const withToken = await login('reset.tester@example.com', 'BrandNewPass456');
  assert.equal(withToken.status, 200, 'new password must work');

  const withOld = await login('reset.tester@example.com', 'OriginalPass123');
  assert.equal(withOld.status, 401, 'old password must stop working');

  const user = await User.findOne({ email: 'reset.tester@example.com' }).select(
    '+resetPasswordToken +resetPasswordExpire'
  );
  assert.equal(user.resetPasswordToken, undefined);
  assert.equal(user.resetPasswordExpire, undefined);
});

test('a reset token cannot be reused', async () => {
  const rawToken = await requestResetToken('reset.tester@example.com');

  const first = await put(`/api/auth/reset-password/${rawToken}`, { password: 'BrandNewPass456' });
  assert.equal(first.status, 200);

  const replay = await put(`/api/auth/reset-password/${rawToken}`, { password: 'AttackerPass789' });
  const replayBody = await replay.json();
  assert.equal(replay.status, 400);
  assert.equal(replayBody.message, 'Invalid or expired token');

  const stillMine = await login('reset.tester@example.com', 'BrandNewPass456');
  assert.equal(stillMine.status, 200, 'the replayed reset must not have changed the password');
});

test('an expired reset token is rejected', async () => {
  const rawToken = await requestResetToken('reset.tester@example.com');

  await User.updateOne(
    { email: 'reset.tester@example.com' },
    { $set: { resetPasswordExpire: Date.now() - 1000 } }
  );

  const res = await put(`/api/auth/reset-password/${rawToken}`, { password: 'BrandNewPass456' });
  assert.equal(res.status, 400);

  const unchanged = await login('reset.tester@example.com', 'OriginalPass123');
  assert.equal(unchanged.status, 200, 'the old password must still work');
});

test('a bogus reset token is rejected', async () => {
  const res = await put('/api/auth/reset-password/deadbeefdeadbeefdeadbeef', {
    password: 'BrandNewPass456',
  });
  assert.equal(res.status, 400);
});

test('reset-password refuses a too-short password', async () => {
  const rawToken = await requestResetToken('reset.tester@example.com');

  const res = await put(`/api/auth/reset-password/${rawToken}`, { password: 'short' });
  assert.equal(res.status, 400);

  const unchanged = await login('reset.tester@example.com', 'OriginalPass123');
  assert.equal(unchanged.status, 200, 'a rejected reset must not consume the password');
});

test('a missing email is rejected up front', async () => {
  const res = await post('/api/auth/forgot-password', {});
  assert.equal(res.status, 400);
});

async function requestResetToken(email) {
  const res = await post('/api/auth/forgot-password', { email });
  assert.equal(res.status, 200);
  const rawToken = mail.lastUrl.split('/').pop();
  assert.ok(rawToken && rawToken.length > 10, 'an emailed reset link should carry a token');
  return rawToken;
}