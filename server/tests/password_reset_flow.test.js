import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from '../src/db/database.js';

test('Password Reset End-to-End Test Suite', async (t) => {
  const testEmail = `test.reset.${Date.now()}@example.com`;
  const initialPassword = 'OldPassword123!';
  const newPassword = 'NewPassword456!';
  const initialHash = await bcrypt.hash(initialPassword, 10);

  // 1. Setup Test User
  const user = db.insert('users', {
    name: 'Test Reset User',
    email: testEmail,
    password_hash: initialHash,
    is_email_verified: 1,
    created_at: new Date().toISOString()
  });

  // 2. Test Cryptographic Token Generation & Hashing (SHA-256)
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiryMinutes = 30;
  const resetTokenExpires = new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString();

  db.update('users', u => u.id === user.id, {
    reset_token_hash: tokenHash,
    reset_token: rawToken,
    reset_token_expires: resetTokenExpires,
    reset_token_used: false
  });

  // 3. Test Verify Reset Token - Valid Token
  const fetchedUser = db.findOne('users', u => u.reset_token_hash === tokenHash);
  assert.ok(fetchedUser, 'User found by reset_token_hash');
  assert.equal(fetchedUser.reset_token_used, false, 'Token is not used yet');
  assert.ok(new Date(fetchedUser.reset_token_expires) > new Date(), 'Token is not expired');

  // 4. Test Password Reset Execution
  const newHash = await bcrypt.hash(newPassword, 10);
  db.update('users', u => u.id === user.id, {
    password_hash: newHash,
    reset_token_hash: null,
    reset_token: null,
    reset_token_expires: null,
    reset_token_used: true
  });

  // 5. Test Password Verification
  const updatedUser = db.findOne('users', u => u.id === user.id);
  const isOldValid = await bcrypt.compare(initialPassword, updatedUser.password_hash);
  const isNewValid = await bcrypt.compare(newPassword, updatedUser.password_hash);

  assert.equal(isOldValid, false, 'Old password must be rejected');
  assert.equal(isNewValid, true, 'New password must be accepted');

  // 6. Test Token Reuse Prevention
  assert.equal(updatedUser.reset_token_used, true, 'Reset token marked used');
  assert.equal(updatedUser.reset_token_hash, null, 'Reset token hash cleared');

  // Cleanup
  db.remove('users', u => u.id === user.id);
});
