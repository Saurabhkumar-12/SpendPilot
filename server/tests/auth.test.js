import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6)
});

test('Auth Input Validation Schema - Valid Payload', () => {
  const payload = { name: 'Rahul Sharma', email: 'rahul@example.com', password: 'Password123!' };
  const parsed = registerSchema.safeParse(payload);
  assert.equal(parsed.success, true);
});

test('Auth Input Validation Schema - Invalid Email & Short Password', () => {
  const payload = { name: 'R', email: 'invalid-email', password: '123' };
  const parsed = registerSchema.safeParse(payload);
  assert.equal(parsed.success, false);
  assert.equal(parsed.error.issues.length, 3);
});

test('Password Hashing & Verification', async () => {
  const rawPass = 'SecretPassword123!';
  const hash = await bcrypt.hash(rawPass, 10);
  const isValid = await bcrypt.compare(rawPass, hash);
  const isInvalid = await bcrypt.compare('WrongPassword', hash);

  assert.equal(isValid, true);
  assert.equal(isInvalid, false);
});

test('Admin Email Authorization Check', () => {
  const adminEmails = ['saurabhkumar8058@gmail.com', 'saurabhkumarr8058@gmail.com'];
  const checkIsAdmin = (email) => Boolean(email && adminEmails.includes(email.toLowerCase().trim()));

  assert.equal(checkIsAdmin('saurabhkumar8058@gmail.com'), true);
  assert.equal(checkIsAdmin('saurabhkumarr8058@gmail.com'), true);
  assert.equal(checkIsAdmin('user@example.com'), false);
});

