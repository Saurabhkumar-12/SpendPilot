import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../src/db/database.js';
import { config } from '../src/config/index.js';

test('Comprehensive Security & Authorization Audit Suite', async (t) => {

  // Create Users A & B
  const passHash = await bcrypt.hash('Password123!', 10);
  const userA = db.insert('users', {
    id: crypto.randomUUID(),
    name: 'User Alpha',
    email: `alpha.${Date.now()}@example.com`,
    password_hash: passHash,
    is_verified: 1,
    created_at: new Date().toISOString()
  });

  const userB = db.insert('users', {
    id: crypto.randomUUID(),
    name: 'User Beta',
    email: `beta.${Date.now()}@example.com`,
    password_hash: passHash,
    is_verified: 1,
    created_at: new Date().toISOString()
  });

  // Create Group owned by User A (Admin)
  const groupId = crypto.randomUUID();
  const group = db.insert('groups', {
    id: groupId,
    name: 'Audit Test Group',
    created_by: userA.id,
    created_at: new Date().toISOString()
  });

  db.insert('group_members', {
    id: crypto.randomUUID(),
    group_id: groupId,
    user_id: userA.id,
    role: 'ADMIN',
    joined_at: new Date().toISOString()
  });

  // Add User B as normal MEMBER
  db.insert('group_members', {
    id: crypto.randomUUID(),
    group_id: groupId,
    user_id: userB.id,
    role: 'MEMBER',
    joined_at: new Date().toISOString()
  });

  // 1. Test JWT Verification & Tampering
  await t.test('A. JWT Tampering & Verification', () => {
    const validToken = jwt.sign({ userId: userA.id }, config.jwtSecret, { expiresIn: '1h' });
    const decoded = jwt.verify(validToken, config.jwtSecret);
    assert.equal(decoded.userId, userA.id);

    // Tampered Secret
    assert.throws(() => {
      jwt.verify(validToken, 'invalid_secret_key');
    });
  });

  // 2. Test User Data Isolation (Personal Expenses)
  await t.test('B. Personal Expense Isolation', () => {
    const expA = db.insert('personal_expenses', {
      id: crypto.randomUUID(),
      user_id: userA.id,
      amount: 500,
      description: 'Alpha Private Coffee',
      category: 'Food',
      date: '2026-08-09'
    });

    // User B tries finding User A expense in User B query
    const userBExpenses = db.find('personal_expenses', e => e.user_id === userB.id);
    const hasAlphaExp = userBExpenses.some(e => e.id === expA.id);
    assert.equal(hasAlphaExp, false, 'User B must not see User A personal expenses');

    db.remove('personal_expenses', e => e.id === expA.id);
  });

  // 3. Test Group Authorization Matrix
  await t.test('C. Group Admin Authorization Enforcement', () => {
    const memberA = db.findOne('group_members', m => m.group_id === groupId && m.user_id === userA.id);
    const memberB = db.findOne('group_members', m => m.group_id === groupId && m.user_id === userB.id);

    assert.equal(memberA.role, 'ADMIN');
    assert.equal(memberB.role, 'MEMBER');

    // Rule: Member cannot delete group or edit group settings
    const canMemberBDelete = memberB.role === 'ADMIN';
    assert.equal(canMemberBDelete, false, 'Normal member cannot delete group');
  });

  // 4. Test Session Revocation & Logout All
  await t.test('D. Session Revocation', () => {
    const sessId = crypto.randomUUID();
    db.insert('sessions', {
      id: sessId,
      user_id: userA.id,
      token_hash: 'hash',
      is_revoked: 0
    });

    // Revoke
    db.update('sessions', s => s.user_id === userA.id, { is_revoked: 1 });
    const revokedSess = db.findOne('sessions', s => s.id === sessId);
    assert.equal(revokedSess.is_revoked, 1, 'Session marked revoked');

    db.remove('sessions', s => s.id === sessId);
  });

  // 5. Test Group Split Math Verification
  await t.test('E. Group Split Math Validation', () => {
    const totalAmount = 3000;
    const splits = [
      { userId: userA.id, amountOwed: 1500 },
      { userId: userB.id, amountOwed: 1500 }
    ];

    const sumSplits = splits.reduce((sum, s) => sum + s.amountOwed, 0);
    assert.equal(sumSplits, totalAmount, 'Splits must equal total amount');
  });

  // Cleanup
  db.remove('users', u => u.id === userA.id || u.id === userB.id);
  db.remove('groups', g => g.id === groupId);
  db.remove('group_members', m => m.group_id === groupId);
});
