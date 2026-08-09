import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';

import { config } from './config/index.js';
import { initDatabase } from './db/database.js';
import { initSocket } from './socket.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './modules/auth/authRoutes.js';
import expenseRoutes from './modules/expenses/expenseRoutes.js';
import groupRoutes from './modules/groups/groupRoutes.js';
import settlementRoutes from './modules/settlements/settlementRoutes.js';
import reportsRoutes from './modules/reports/reportsRoutes.js';
import notificationRoutes from './modules/notifications/notificationsRoutes.js';
import searchRoutes from './modules/search/searchRoutes.js';
import insightsRoutes from './modules/insights/insightsRoutes.js';
import profileRoutes from './modules/profile/profileRoutes.js';
import feedbackRoutes from './modules/feedback/feedbackRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Initialize DB & Socket.IO
initDatabase();
initSocket(server);

// Security Headers & Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
const allowedOrigins = [
  config.appUrl,
  process.env.CORS_ORIGIN,
  process.env.CLIENT_URL,
  'https://spendpilot-coral.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      (config.env === 'development' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || ''))
    ) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation: Origin not allowed.'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Serve Uploaded Avatars securely
app.use('/uploads', express.static(path.resolve('uploads')));

// General API Rate Limiting
app.use('/api', apiRateLimiter);

// Healthcheck
app.get(['/api/health', '/api/v1/health'], (req, res) => {
  res.json({ success: true, message: 'SpendPilot API is running', timestamp: new Date().toISOString() });
});

// Feature API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/expenses', expenseRoutes);
app.use('/api/v1/groups', groupRoutes);
app.use('/api/v1/settlements', settlementRoutes);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/insights', insightsRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/feedback', feedbackRoutes);

// Fallback 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Endpoint ${req.originalUrl} not found.` });
});

// Global Error Handler
app.use(errorHandler);

const PORT = config.port;
const HOST = process.env.HOST || '0.0.0.0';
server.listen(PORT, HOST, () => {
  console.log(`\n==================================================`);
  console.log(`🚀 SpendPilot Server running on http://localhost:${PORT}`);
  console.log(`EMAIL_API_KEY configured: ${config.resendApiKey ? 'YES' : 'NO'}`);
  console.log(`EMAIL_FROM configured: ${process.env.EMAIL_FROM ? 'YES' : 'NO'}`);
  console.log(`APP_URL: ${config.appUrl}`);
  console.log(`==================================================\n`);
});
