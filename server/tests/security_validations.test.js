import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../src/config/index.js';
import { db } from '../src/db/database.js';

test('Security - JWT Token Verification & Expiry Standard', () => {
  const payload = { userId: 'sec-user-123', email: 'sec@spendpilot.com', sessionId: 'sess-123' };
  const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '1h' });

  const decoded = jwt.verify(token, config.jwtSecret);
  assert.equal(decoded.userId, 'sec-user-123');
  assert.equal(decoded.email, 'sec@spendpilot.com');
  assert.ok(decoded.exp > decoded.iat);
});

test('Security - Invalid JWT Secret Standard Rejection', () => {
  const payload = { userId: 'sec-user-123' };
  const forgedToken = jwt.sign(payload, 'wrong_secret_key');

  assert.throws(() => {
    jwt.verify(forgedToken, config.jwtSecret);
  }, /invalid signature/);
});

test('Security - Bcrypt Password Hashing Standard', async () => {
  const password = 'StrongPassword123!';
  const hash = await bcrypt.hash(password, 10);

  assert.notEqual(password, hash);
  assert.ok(hash.startsWith('$2a$') || hash.startsWith('$2b$'));

  const isMatch = await bcrypt.compare(password, hash);
  const isWrongMatch = await bcrypt.compare('WrongPassword', hash);

  assert.equal(isMatch, true);
  assert.equal(isWrongMatch, false);
});

test('Security - Database Collection Isolation', () => {
  const user = db.findOne('users', u => u.email === 'sec_test_user@example.com');
  if (user) {
    db.remove('users', u => u.id === user.id);
  }

  const inserted = db.insert('users', {
    id: 'sec-usr-99',
    name: 'Security User',
    email: 'sec_test_user@example.com',
    password_hash: 'hashed_secret'
  });

  assert.equal(inserted.id, 'sec-usr-99');
  const found = db.findOne('users', u => u.id === 'sec-usr-99');
  assert.ok(found);

  db.remove('users', u => u.id === 'sec-usr-99');
  const afterRemove = db.findOne('users', u => u.id === 'sec-usr-99');
  assert.equal(afterRemove, null);
});
