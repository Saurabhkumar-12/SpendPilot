# SpendPilot - Track. Split. Save.

![SpendPilot Logo](https://img.shields.io/badge/SpendPilot-Fintech_App-6366f1)
![Node Version](https://img.shields.io/badge/node-v24.17.0-emerald)
![License](https://img.shields.io/badge/license-MIT-blue)

SpendPilot is an enterprise-grade personal and group expense management application designed to track spending, split shared bills, and calculate minimal debt settlements using graph optimization algorithms.

---

## 🌟 Key Features

- 🔐 **Authentication & Session Security**: Registration, Email verification, JWT authentication with "Remember Me", Password Reset, and "Logout All Devices" session revocation token engine.
- 📊 **Real-Time Fintech Dashboard**: Dynamic financial summary cards, Recharts spending trend bar chart, category breakdown donut chart, recent transactions, and group debt feeds.
- 💳 **Personal Expense Tracking**: CRUD operations, custom category manager with color pickers, payment method tagging (UPI, Cash, Credit Card, Debit Card, Net Banking), filtering, sorting, and CSV/PDF export.
- 👥 **Group Bills & Multi-Mode Splitting**: Create groups (Trip, Roommates, Office, Family, etc.), invite members, and split bills in 3 modes:
  - **Equal Split**
  - **Percentage Split** (validates 100% total)
  - **Exact Amount Split** (validates exact total match)
- 🧮 **Greedy Debt Settlement Engine**: Graph solver reducing $N(N-1)$ circular group debts into the absolute minimum transaction count.
- 🔍 **Command-K Global Search**: Instant command palette search across expenses, categories, groups, and amounts.
- 🤖 **AI Spending Advisor & Live FX**: AI Financial Health Score (0-100), personalized recommendations, and live 24-hour cached exchange rate converter.
- 🛡️ **Enterprise Security**: Rate limiting with exponential backoff, Zod schema validation, Helmet headers, CORS policies, safe avatar file upload sandboxing, and security audit logs.

---

## 🚀 Quick Start Instructions

### Prerequisites
- **Node.js**: v18+ or v24+
- **npm**: 9+ or 11+

### 1. Server Setup
```bash
cd server
npm install
npm start
```
The Express REST API server will run on `http://localhost:5000`.

### 2. Client Setup
```bash
cd client
npm install
npm run dev
```
The React + Vite frontend SPA will run on `http://localhost:5173`.

---

## 🔑 Demo Login Credentials

- **Email**: `rahul@spendpilot.com` | **Password**: `Password123!`
- **Email**: `saurabh@spendpilot.com` | **Password**: `Password123!`
- **Email**: `aman@spendpilot.com` | **Password**: `Password123!`
- **Email**: `neha@spendpilot.com` | **Password**: `Password123!`

---

## 📚 Detailed Documentation

- 📖 [API Documentation](docs/API_DOCUMENTATION.md)
- ⚙️ [Environment Setup Guide](docs/ENVIRONMENT_SETUP.md)
- 🚀 [Production Deployment Guide](docs/DEPLOYMENT_GUIDE.md)
- 🗄️ [Database Schema Reference](docs/DATABASE_SCHEMA.md)
- 🧪 [Automated Testing Guide](docs/TESTING_GUIDE.md)
