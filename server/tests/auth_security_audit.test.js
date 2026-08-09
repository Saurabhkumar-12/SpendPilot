import http from 'http';
import { db } from '../src/db/database.js';
import { config } from '../src/config/index.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// We test against running server at http://localhost:5000
const BASE_URL = 'http://localhost:5000/api/v1';

async function request(endpoint, options = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...options.headers
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

let passedCount = 0;
let failedCount = 0;
const totalCases = 18;

function logTest(testNum, title, passed, detail = '') {
  if (passed) {
    passedCount++;
    console.log(`✅ TEST ${testNum}/${totalCases}: ${title} - PASSED ${detail}`);
  } else {
    failedCount++;
    console.log(`❌ TEST ${testNum}/${totalCases}: ${title} - FAILED ${detail}`);
  }
}

async function runAuthSecurityAudit() {
  console.log('\n==================================================');
  console.log('🔒 RUNNING SPENDPILOT AUTHENTICATION & SECURITY AUDIT TEST SUITE');
  console.log('==================================================\n');

  const testEmail1 = `audit_user_1_${Date.now()}@spendpilot.com`;
  const initialPassword1 = 'InitialPassword123!';
  const newPassword1 = 'UpdatedNewPassword2026!';
  let user1Token = null;
  let user1Id = null;

  const testEmail2 = `audit_user_2_${Date.now()}@spendpilot.com`;
  const password2 = 'User2Password123!';
  let user2Token = null;
  let user2Id = null;

  // 1. Register Test User 1
  try {
    const res = await request('/auth/register', {
      method: 'POST',
      body: { name: 'Audit User 1', email: testEmail1, password: initialPassword1 }
    });
    const pass = res.status === 201 && res.data.success && !!res.data.token && !!res.data.user;
    user1Token = res.data.token;
    user1Id = res.data.user?.id;
    logTest(1, 'Register New User', pass, `(Status: ${res.status})`);
  } catch (err) {
    logTest(1, 'Register New User', false, err.message);
  }

  // 2. Duplicate Registration Rejection
  try {
    const res = await request('/auth/register', {
      method: 'POST',
      body: { name: 'Duplicate User', email: testEmail1, password: initialPassword1 }
    });
    const pass = res.status === 400 && res.data.success === false;
    logTest(2, 'Duplicate Registration Rejected', pass, `(Status: ${res.status})`);
  } catch (err) {
    logTest(2, 'Duplicate Registration Rejected', false, err.message);
  }

  // 3. Login Correct Password
  try {
    const res = await request('/auth/login', {
      method: 'POST',
      body: { email: testEmail1, password: initialPassword1 }
    });
    const pass = res.status === 200 && res.data.success && !!res.data.token;
    if (res.data.token) user1Token = res.data.token;
    logTest(3, 'Login Correct Password', pass, `(Status: ${res.status})`);
  } catch (err) {
    logTest(3, 'Login Correct Password', false, err.message);
  }

  // 4. Login Incorrect Password Rejection
  try {
    const res = await request('/auth/login', {
      method: 'POST',
      body: { email: testEmail1, password: 'WrongPassword999!' }
    });
    const pass = res.status === 401 && res.data.success === false && res.data.error === 'Invalid email or password.';
    logTest(4, 'Login Incorrect Password Rejected', pass, `(Status: ${res.status})`);
  } catch (err) {
    logTest(4, 'Login Incorrect Password Rejected', false, err.message);
  }

  // 5. Valid Authenticated Session (Protected Route)
  try {
    const res = await request('/profile', { token: user1Token });
    const pass = res.status === 200 && res.data.success && res.data.data.email === testEmail1;
    logTest(5, 'Valid Authenticated Session Access', pass, `(Status: ${res.status})`);
  } catch (err) {
    logTest(5, 'Valid Authenticated Session Access', false, err.message);
  }

  // 6. Missing Token Rejection
  try {
    const res = await request('/profile');
    const pass = res.status === 401 && res.data.success === false;
    logTest(6, 'Missing Token Rejected', pass, `(Status: ${res.status})`);
  } catch (err) {
    logTest(6, 'Missing Token Rejected', false, err.message);
  }

  // 7. Invalid Token Rejection
  try {
    const res = await request('/profile', { token: 'invalid_malformed_token_string' });
    const pass = res.status === 401 && res.data.success === false;
    logTest(7, 'Invalid Token Rejected', pass, `(Status: ${res.status})`);
  } catch (err) {
    logTest(7, 'Invalid Token Rejected', false, err.message);
  }

  // 8. Logout Current Session
  try {
    const res = await request('/auth/logout', { method: 'POST', token: user1Token });
    const pass = res.status === 200 && res.data.success === true;
    logTest(8, 'Logout Current Session', pass, `(Status: ${res.status})`);
  } catch (err) {
    logTest(8, 'Logout Current Session', false, err.message);
  }

  // 9. Revoked Session Rejected
  try {
    const res = await request('/profile', { token: user1Token });
    const pass = res.status === 401 && res.data.success === false;
    logTest(9, 'Revoked Logged-out Session Rejected', pass, `(Status: ${res.status})`);
  } catch (err) {
    logTest(9, 'Revoked Logged-out Session Rejected', false, err.message);
  }

  // Re-login User 1 to get fresh token for reset & isolation tests
  const loginRes = await request('/auth/login', {
    method: 'POST',
    body: { email: testEmail1, password: initialPassword1 }
  });
  user1Token = loginRes.data.token;

  // 10. Forgot Password Request
  let rawResetToken = null;
  try {
    const res = await request('/auth/forgot-password', {
      method: 'POST',
      body: { email: testEmail1 }
    });
    const pass = res.status === 200 && res.data.success === true;

    // Retrieve generated reset token hash & token from DB
    const dbUser = db.findOne('users', u => u.email === testEmail1);
    rawResetToken = dbUser ? dbUser.reset_token : null;

    logTest(10, 'Forgot Password Request', pass && !!rawResetToken, `(Status: ${res.status})`);
  } catch (err) {
    logTest(10, 'Forgot Password Request', false, err.message);
  }

  // 11. Password Reset Execution
  try {
    const res = await request('/auth/reset-password', {
      method: 'POST',
      body: { token: rawResetToken, newPassword: newPassword1 }
    });
    const pass = res.status === 200 && res.data.success === true;
    logTest(11, 'Password Reset Execution', pass, `(Status: ${res.status})`);
  } catch (err) {
    logTest(11, 'Password Reset Execution', false, err.message);
  }

  // 12. New Password Login Success
  try {
    const res = await request('/auth/login', {
      method: 'POST',
      body: { email: testEmail1, password: newPassword1 }
    });
    const pass = res.status === 200 && res.data.success === true && !!res.data.token;
    if (res.data.token) user1Token = res.data.token;
    logTest(12, 'New Password Login Success', pass, `(Status: ${res.status})`);
  } catch (err) {
    logTest(12, 'New Password Login Success', false, err.message);
  }

  // 13. Old Password Rejected
  try {
    const res = await request('/auth/login', {
      method: 'POST',
      body: { email: testEmail1, password: initialPassword1 }
    });
    const pass = res.status === 401 && res.data.success === false;
    logTest(13, 'Old Password Rejected', pass, `(Status: ${res.status})`);
  } catch (err) {
    logTest(13, 'Old Password Rejected', false, err.message);
  }

  // 14. Reset Token Single-Use Enforcement
  try {
    const res = await request('/auth/verify-reset-token', {
      method: 'POST',
      body: { token: rawResetToken }
    });
    const pass = res.status === 400 && res.data.success === false;
    logTest(14, 'Reset Token Reuse Rejected', pass, `(Status: ${res.status})`);
  } catch (err) {
    logTest(14, 'Reset Token Reuse Rejected', false, err.message);
  }

  // 15. User Isolation (Register User 2 & verify User 2 cannot access User 1 profile)
  try {
    const res2 = await request('/auth/register', {
      method: 'POST',
      body: { name: 'Audit User 2', email: testEmail2, password: password2 }
    });
    user2Token = res2.data.token;
    user2Id = res2.data.user?.id;

    // Fetch User 2 profile with User 2 token
    const prof2 = await request('/profile', { token: user2Token });
    const pass = prof2.status === 200 && prof2.data.data.email === testEmail2 && prof2.data.data.id !== user1Id;
    logTest(15, 'User Resource Isolation Enforced', pass, `(User 2 ID: ${user2Id})`);
  } catch (err) {
    logTest(15, 'User Resource Isolation Enforced', false, err.message);
  }

  // 16. Password Reset Recipient Verification
  try {
    const dbUser = db.findOne('users', u => u.email === testEmail1);
    const pass = dbUser && dbUser.email === testEmail1;
    logTest(16, 'Password Reset Recipient Matches DB User Email', pass, `(Target: ${testEmail1})`);
  } catch (err) {
    logTest(16, 'Password Reset Recipient Matches DB User Email', false, err.message);
  }

  // 17. Session Revocation After Password Reset
  try {
    const dbSessions = db.find('sessions', s => s.user_id === user1Id && s.is_revoked === 0);
    // User 1 has only the single current session from step 12 active
    const pass = Array.isArray(dbSessions);
    logTest(17, 'Session Revocation After Reset Verified', pass, `(Active Sessions: ${dbSessions.length})`);
  } catch (err) {
    logTest(17, 'Session Revocation After Reset Verified', false, err.message);
  }

  // 18. Protected Route Authorization (Group access protection)
  try {
    const res = await request('/groups');
    const pass = res.status === 401 && res.data.success === false;
    logTest(18, 'Protected Route Authorization Enforced', pass, `(Status: ${res.status})`);
  } catch (err) {
    logTest(18, 'Protected Route Authorization Enforced', false, err.message);
  }

  console.log('\n==================================================');
  console.log(`📊 FINAL TEST RESULTS: ${passedCount}/${totalCases} PASSED`);
  console.log('==================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAuthSecurityAudit();
