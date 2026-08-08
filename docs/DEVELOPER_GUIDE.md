# SpendPilot Developer Guide

Welcome to the SpendPilot core developer reference manual!

---

## 1. Code Architecture & Conventions

SpendPilot follows a **Feature-Based Modular Architecture** where each domain module (`auth`, `expenses`, `groups`, `settlements`, `reports`, `notifications`, `search`, `insights`, `profile`) contains its own controllers and route definitions.

### Backend Controller Pattern
```javascript
export const featureController = {
  async handleAction(req, res, next) {
    try {
      // 1. Input parsing
      // 2. Database query via db helper
      // 3. Audit log recording
      // 4. Uniform JSON response
    } catch (err) {
      next(err); // Handled by global errorHandler
    }
  }
};
```

---

## 2. Adding a New API Endpoint

1. Create or open controller under `server/src/modules/<feature>/<feature>Controller.js`.
2. Define input schema using Zod under `<feature>Routes.js`.
3. Protect route with `authGuard` middleware.
4. Add unit test under `server/tests/`.
