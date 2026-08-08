# SpendPilot Testing & Verification Guide

This guide describes how to run unit, integration, and security tests for SpendPilot.

---

## 1. Running Server Automated Tests

SpendPilot uses Node's native test runner (`node --test`).

To run the complete automated test suite:
```bash
cd server
node --test tests/*.test.js
```

### Test Suite Output
```text
✔ Healthcheck Endpoint Status (57ms)
✔ Auth Input Validation Schema - Valid Payload (2ms)
✔ Auth Input Validation Schema - Invalid Email & Short Password (1ms)
✔ Password Hashing & Verification (222ms)
✔ Greedy Debt Solver - Simple 2 Person Debt (0.7ms)
✔ Greedy Debt Solver - 4 Person Circular Debt Reduction (0.2ms)

tests 6 | pass 6 | fail 0
```

---

## 2. Client Production Build Verification

To verify that the frontend compiles cleanly without any TypeScript / JSX / syntax errors:
```bash
cd client
npm run build
```
Output static files will be placed in `client/dist/`.
