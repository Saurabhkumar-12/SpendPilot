import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/index.js';

test('JWT Access Secret & Refresh Secret Integration Test', () => {
  assert.ok(config.jwtSecret, 'JWT_ACCESS_SECRET must be defined');
  assert.ok(config.jwtRefreshSecret, 'JWT_REFRESH_SECRET must be defined');

  const payload = { userId: 'usr-test-123', email: 'test@spendpilot.com' };

  // Sign with Access Secret
  const accessToken = jwt.sign(payload, config.jwtSecret, { expiresIn: '15m' });
  const decodedAccess = jwt.verify(accessToken, config.jwtSecret);
  assert.equal(decodedAccess.userId, 'usr-test-123');

  // Sign with Refresh Secret
  const refreshToken = jwt.sign(payload, config.jwtRefreshSecret, { expiresIn: '7d' });
  const decodedRefresh = jwt.verify(refreshToken, config.jwtRefreshSecret);
  assert.equal(decodedRefresh.userId, 'usr-test-123');

  // Ensure Access Secret cannot decode Refresh Token (prevent cross-key forging)
  assert.throws(() => {
    jwt.verify(refreshToken, config.jwtSecret);
  });
});
