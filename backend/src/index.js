// src/index.js - Express Application Entry Point
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const templateRoutes = require('./routes/templates');
const orderRoutes = require('./routes/orders');
const statsRoutes = require('./routes/stats');
const panelRoutes = require('./routes/panels');
// no legacy scheduler

const { defineJobs, startAgenda } = require('./config/agenda');
const Order = require('./models/Order');

const compression = require('compression');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust Render's proxy for rate limiting to work correctly
app.set('trust proxy', 1);

const server = http.createServer(app);
const io = new Server(server, { 
  cors: { 
    origin: process.env.FRONTEND_URL || '*',
    methods: ["GET", "POST"]
  } 
});

// Socket.io connection logic
io.on('connection', (socket) => {
  console.log('[Socket] Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('[Socket] Client disconnected:', socket.id);
  });
});

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(helmet());
app.use(compression()); // Compress all responses
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));

// Request Logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Rate limiting: 200 requests per 15 minutes per IP
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please try again later.' },
}));

// ─── Body Parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/templates', templateRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/panels', panelRoutes);

// Health check / Stay-awake route
app.get('/api/health', async (req, res) => {
  try {
    // Ping DB to keep connection active
    await mongoose.connection.db.admin().ping();
    res.json({ 
      success: true, 
      status: 'active', 
      uptime: process.uptime(),
      timestamp: new Date().toISOString() 
    });
  } catch (err) {
    console.error('[Health Check Error]', err.message);
    res.status(500).json({ success: false, error: 'DB Offline' });
  }
});

// Root route for Render/Deployment Health Checks
app.get('/', (req, res) => {
  res.json({ name: 'SMM Drip-Feed API', status: 'online', version: '1.0.0' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Express Error]', err.message);
  res.status(err.status || 500).json({ success: false, error: err.message || 'Internal server error' });
});

// ─── Database & Server Start ─────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    maxPoolSize: 10,
  })
  .then(async () => {
    console.log('[DB] Connected to MongoDB');

    // Start Agenda job processor in the same process
    await startAgenda(io);

    // ─── MongoDB Change Streams for Real-time Socket.io Updates ──────────────────
    // This allows the Web Service to emit progress updates even if the Worker 
    // is the one updating the database.
    const orderCollection = mongoose.connection.collection('orders');
    const changeStream = orderCollection.watch();

    changeStream.on('change', async (change) => {
      if (change.operationType === 'update' || change.operationType === 'replace') {
        const orderId = change.documentKey._id;
        const updatedOrder = await Order.findById(orderId);
        
        if (updatedOrder) {
          io.emit('order-update', {
            orderId: updatedOrder._id,
            delivered: updatedOrder.delivered,
            deliveredViews: updatedOrder.deliveredViews,
            deliveredLikes: updatedOrder.deliveredLikes,
            status: updatedOrder.status,
            nextDripAt: updatedOrder.nextDripAt
          });
          console.log(`[Socket] Emitted update for Order ${orderId}`);
        }
      }
    });
    console.log('[ChangeStream] Listening for Order updates...');
    // ─────────────────────────────────────────────────────────────────────────────

    server.listen(PORT, () => {
      console.log(`[Server] SMM Drip-Feed API running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('[DB] MongoDB connection failed:', err.message);
    process.exit(1);
  });

module.exports = app;
