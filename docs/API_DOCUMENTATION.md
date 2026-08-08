# SpendPilot REST API Documentation

Base URL: `http://localhost:5000/api/v1`

---

## 1. Authentication Endpoints

### Register Account
`POST /auth/register`
```json
{
  "name": "Rahul Sharma",
  "email": "rahul@spendpilot.com",
  "password": "Password123!"
}
```

### User Login
`POST /auth/login`
```json
{
  "email": "rahul@spendpilot.com",
  "password": "Password123!",
  "rememberMe": true
}
```

### Logout All Devices
`POST /auth/logout-all` (Requires `Authorization: Bearer <token>`)

---

## 2. Personal Expenses Endpoints

### List Expenses
`GET /expenses/personal?category=Food&paymentMethod=UPI&sortBy=date`

### Create Personal Expense
`POST /expenses/personal`
```json
{
  "amount": 450,
  "category": "Food",
  "description": "Lunch at Cafe Bistro",
  "date": "2026-08-05",
  "paymentMethod": "UPI"
}
```

### Create Custom Category
`POST /expenses/categories/custom`
```json
{
  "name": "Subscriptions",
  "color": "#8b5cf6"
}
```

---

## 3. Groups & Shared Split Endpoints

### Create Expense Group
`POST /groups`
```json
{
  "name": "Goa Trip 2026",
  "description": "Hotel and dinner expenses",
  "groupType": "Trip"
}
```

### Add Group Shared Expense (Equal, Percentage, Exact)
`POST /groups/:groupId/expenses`
```json
{
  "amount": 8000,
  "category": "Rent",
  "description": "Baga Beach Hotel Stay",
  "paidById": "usr-rahul",
  "splitType": "EQUAL",
  "splits": [
    { "userId": "usr-rahul", "amountOwed": 2000 },
    { "userId": "usr-saurabh", "amountOwed": 2000 },
    { "userId": "usr-aman", "amountOwed": 2000 },
    { "userId": "usr-neha", "amountOwed": 2000 }
  ]
}
```

---

## 4. Settlement Engine Endpoints

### Get Pending Minimal Debts
`GET /settlements/pending`

### Record Payout Settlement
`POST /settlements/settle`
```json
{
  "groupId": "grp-goa",
  "payerId": "usr-neha",
  "payeeId": "usr-rahul",
  "amount": 2000,
  "notes": "Paid via Google Pay"
}
```

---

## 5. Reports & AI Insights Endpoints

### Get Dashboard Analytics Summary
`GET /reports/dashboard`

### Get AI Financial Health Score & Recommendations
`GET /insights/ai`

### Live Currency Conversion Query
`GET /insights/convert?amount=100&from=USD&to=INR`
