# SpendPilot Contribution Guide

We welcome contributions to SpendPilot! Follow these guidelines for smooth collaboration.

---

## 1. Branch Strategy & PR Guidelines

- `main`: Production-ready code.
- `develop`: Integration branch.
- `feature/<name>`: New features or bug fixes.

---

## 2. Pre-Commit Checklist

Before submitting a Pull Request (PR):
1. Run automated backend test suite:
   ```bash
   cd server
   node --test tests/*.test.js
   ```
2. Verify production bundle compilation:
   ```bash
   cd client
   npm run build
   ```
3. Ensure no hardcoded credentials or API keys exist.
