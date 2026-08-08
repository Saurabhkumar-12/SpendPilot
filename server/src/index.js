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
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174'],
  credentials: true
}));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Serve Uploaded Avatars securely
app.use('/uploads', express.static(path.resolve('uploads')));

// General API Rate Limiting
app.use('/api', apiRateLimiter);

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'SpendPilot API service operational.', timestamp: new Date().toISOString() });
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
server.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🚀 SpendPilot Server running on http://localhost:${PORT}`);
  console.log(`⚡ Real-Time Socket.IO Cluster Operational`);
  console.log(`🔒 Security Rate Limiters & Helmet Active`);
  console.log(`==================================================\n`);
});
