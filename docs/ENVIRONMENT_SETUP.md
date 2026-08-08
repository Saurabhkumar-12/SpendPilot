# SpendPilot Environment Setup Guide

This guide details all configuration variables required for SpendPilot server and client environments.

---

## Backend `.env` Configuration (`server/.env`)

```env
# Server Port
PORT=5000

# Node Environment
NODE_ENV=development

# JWT Secret Keys
JWT_SECRET=spendpilot_super_secure_jwt_secret_key_2026_prod
JWT_EXPIRES_IN=24h
JWT_REMEMBER_EXPIRES_IN=30d

# File Upload Directory
UPLOAD_DIR=./uploads

# Third-Party Service Keys (Optional - Fallbacks Available)
EMAIL_API_KEY=
EXCHANGE_API_KEY=
GEMINI_API_KEY=
```

---

## Frontend Setup (`client/.env`)

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```
