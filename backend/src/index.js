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

// Simple Request Logger
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
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
// ─── Database & Server Start ─────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    maxPoolSize: 10,
  })
  .then(async () => {
    console.log('[DB] Connected to MongoDB');
    
    defineJobs(io);

    // Change Stream for Socket.io
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

    // ✅ FIXED LISTEN BLOCK
    server.listen(PORT, () => {
      console.log(`[Server] SMM Drip-Feed API running on port ${PORT}`);
      console.log(`[Render] Backend is LIVE → https://${process.env.RENDER_EXTERNAL_HOSTNAME || 'localhost'}`);
    });
  })
  .catch(err => {
    console.error('[DB] MongoDB connection failed:', err.message);
    process.exit(1);
  });

module.exports = app;
