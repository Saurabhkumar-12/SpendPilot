import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { config } from '../src/config/index.js';
import { initDatabase, db } from '../src/db/database.js';
import authRoutes from '../src/modules/auth/authRoutes.js';
import expenseRoutes from '../src/modules/expenses/expenseRoutes.js';
import groupRoutes from '../src/modules/groups/groupRoutes.js';
import settlementRoutes from '../src/modules/settlements/settlementRoutes.js';
import reportsRoutes from '../src/modules/reports/reportsRoutes.js';
import notificationRoutes from '../src/modules/notifications/notificationsRoutes.js';
import searchRoutes from '../src/modules/search/searchRoutes.js';
import insightsRoutes from '../src/modules/insights/insightsRoutes.js';
import profileRoutes from '../src/modules/profile/profileRoutes.js';
import { errorHandler } from '../src/middleware/errorHandler.js';

let server;
let baseUrl;

// Test state across suite
let authToken = '';
let refreshToken = '';
let userId = '';
let createdExpenseId = '';
let createdGroupId = '';
let secondUserId = '';
let secondAuthToken = '';
let secondUserEmail = '';

before(async () => {
  initDatabase();
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'SpendPilot API operational.', timestamp: new Date().toISOString() });
  });

  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/expenses', expenseRoutes);
  app.use('/api/v1/groups', groupRoutes);
  app.use('/api/v1/settlements', settlementRoutes);
  app.use('/api/v1/reports', reportsRoutes);
  app.use('/api/v1/notifications', notificationRoutes);
  app.use('/api/v1/search', searchRoutes);
  app.use('/api/v1/insights', insightsRoutes);
  app.use('/api/v1/profile', profileRoutes);

  app.use(errorHandler);

  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

// 1. Health check
test('E2E - Health Check Endpoint', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
});

// 2. Authentication Workflow
test('E2E - User Registration', async () => {
  const testEmail = `qa_test_${Date.now()}@spendpilot.com`;
  const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'QA Test User',
      email: testEmail,
      password: 'Password123!'
    })
  });

  assert.equal(res.status, 201);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.ok(json.token);
  assert.ok(json.refreshToken);
  assert.ok(json.user.id);

  authToken = json.token;
  refreshToken = json.refreshToken;
  userId = json.user.id;
});

test('E2E - Second User Registration (for multi-user group tests)', async () => {
  const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'QA Friend User',
      email: `friend_${Date.now()}@spendpilot.com`,
      password: 'Password123!'
    })
  });

  assert.equal(res.status, 201);
  const json = await res.json();
  secondAuthToken = json.token;
  secondUserId = json.user.id;
  secondUserEmail = json.user.email;
});

test('E2E - Token Refresh Route', async () => {
  const res = await fetch(`${baseUrl}/api/v1/auth/refresh-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });

  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.ok(json.token);
  // Update auth token
  authToken = json.token;
});

test('E2E - Verify Email Route', async () => {
  const res = await fetch(`${baseUrl}/api/v1/auth/verify-email?token=dummy-token`);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
});

// 3. Profile & Preferences
test('E2E - Get User Profile', async () => {
  const res = await fetch(`${baseUrl}/api/v1/profile`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.equal(json.data.id, userId);
});

test('E2E - Update User Profile & Preferences', async () => {
  const res = await fetch(`${baseUrl}/api/v1/profile/preferences`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`
    },
    body: JSON.stringify({ currency: '₹', theme: 'dark', defaultSplitMode: 'EQUAL' })
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
});

// 4. Personal Expenses
test('E2E - Create Personal Expense', async () => {
  const res = await fetch(`${baseUrl}/api/v1/expenses/personal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`
    },
    body: JSON.stringify({
      amount: 450,
      category: 'Food',
      description: 'Team Lunch',
      paymentMethod: 'UPI'
    })
  });

  assert.equal(res.status, 201);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.equal(json.data.amount, 450);
  createdExpenseId = json.data.id;
});

test('E2E - List & Filter Personal Expenses', async () => {
  const res = await fetch(`${baseUrl}/api/v1/expenses/personal?category=Food`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.ok(json.data.length >= 1);
});

test('E2E - Create Custom Category', async () => {
  const res = await fetch(`${baseUrl}/api/v1/expenses/categories/custom`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`
    },
    body: JSON.stringify({ name: 'Gadgets', icon: 'Laptop', color: '#10B981' })
  });
  assert.equal(res.status, 201);
  const json = await res.json();
  assert.equal(json.success, true);
});

// 5. Groups & Debt Splits
test('E2E - Create Group', async () => {
  const res = await fetch(`${baseUrl}/api/v1/groups`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`
    },
    body: JSON.stringify({
      name: 'Goa Trip 2026',
      description: 'Vacation expenses',
      groupType: 'Trip'
    })
  });

  assert.equal(res.status, 201);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.equal(json.data.name, 'Goa Trip 2026');
  createdGroupId = json.data.id;

  // Add second user to group members
  db.insert('group_members', {
    id: 'test-gm-2',
    group_id: createdGroupId,
    user_id: secondUserId,
    role: 'MEMBER',
    joined_at: new Date().toISOString()
  });
});

test('E2E - Add Group Expense & Split', async () => {
  const res = await fetch(`${baseUrl}/api/v1/groups/${createdGroupId}/expenses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`
    },
    body: JSON.stringify({
      amount: 2000,
      category: 'Travel',
      description: 'Cab Booking',
      paidById: userId,
      splitType: 'EQUAL',
      splits: [
        { userId, amountOwed: 1000 },
        { userId: secondUserId, amountOwed: 1000 }
      ]
    })
  });

  assert.equal(res.status, 201);
  const json = await res.json();
  assert.equal(json.success, true);
});

// 6. Settlements
test('E2E - Get Pending Settlements', async () => {
  const res = await fetch(`${baseUrl}/api/v1/settlements/pending`, {
    headers: { Authorization: `Bearer ${secondAuthToken}` }
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.ok(Array.isArray(json.data));
});

test('E2E - Mark Settlement as Settled', async () => {
  const res = await fetch(`${baseUrl}/api/v1/settlements/settle`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secondAuthToken}`
    },
    body: JSON.stringify({
      groupId: createdGroupId,
      payerId: secondUserId,
      payeeId: userId,
      amount: 1000,
      notes: 'Paid via GPay'
    })
  });

  assert.equal(res.status, 201);
  const json = await res.json();
  assert.equal(json.success, true);
});

// 7. Reports & Dashboard Summary
test('E2E - Get Dashboard Summary', async () => {
  const res = await fetch(`${baseUrl}/api/v1/reports/dashboard`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.ok(json.data.summary);
});

// 8. Notifications
test('E2E - Get Notifications', async () => {
  const res = await fetch(`${baseUrl}/api/v1/notifications`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.ok(Array.isArray(json.data));
});

// 9. Search & Insights API
test('E2E - Global Search', async () => {
  const res = await fetch(`${baseUrl}/api/v1/search?q=Lunch`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
});

test('E2E - Insights API', async () => {
  const res = await fetch(`${baseUrl}/api/v1/insights/ai`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
});
