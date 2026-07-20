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
const Template = require('./models/Template');
const Panel = require('./models/Panel');

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

async function seedDefaultTemplates() {
  try {
    // Fetch default panel
    const panels = await Panel.find({ isActive: true });
    const defaultPanel = panels.find(p => p.isDefault) || panels[0] || null;
    const defaultPanelId = defaultPanel ? defaultPanel._id : null;

    const presets = [
      {
        name: 'Starter Template Default',
        description: 'First payout target template. Drip targets 1K-5K views with 20-25 engagements (likes). Decoupled triggers prevent bot flagging.',
        category: 'Starter',
        growthType: 'Balanced',
        viewsPanel: defaultPanelId,
        likesPanel: defaultPanelId,
        viewsServiceId: '1001',
        likesServiceId: '1002',
        minViewsPerCycle: 100,
        maxViewsPerCycle: 250,
        maxViewsTotal: 5000,
        viewsRandomizationPct: 10,
        accelerationCurve: 'Balanced',
        likesStartTick: 3,
        minLikesPerCycle: 2,
        maxLikesPerCycle: 5,
        likesTotalHits: 25,
        likesDelayMins: 5,
        minGapMins: 45,
        maxGapMins: 90,
      },
      {
        name: 'Growth Template Default',
        description: 'Mid-stage scaling (5K-25K Views) with comment delays for natural growth engagement signature.',
        category: 'Growth',
        growthType: 'Balanced',
        viewsPanel: defaultPanelId,
        likesPanel: defaultPanelId,
        viewsServiceId: '1001',
        likesServiceId: '1002',
        minViewsPerCycle: 300,
        maxViewsPerCycle: 800,
        maxViewsTotal: 25000,
        viewsRandomizationPct: 15,
        accelerationCurve: 'Balanced',
        likesStartTick: 3,
        minLikesPerCycle: 10,
        maxLikesPerCycle: 30,
        likesTotalHits: 200,
        likesDelayMins: 10,
        enableComments: true,
        commentsStartTick: 4,
        minCommentsPerCycle: 1,
        maxCommentsPerCycle: 3,
        commentsDelayMins: 15,
        minGapMins: 30,
        maxGapMins: 90,
      },
      {
        name: 'Momentum Template Default',
        description: 'Heavy distribution targeting 25K-100K views.',
        category: 'Momentum',
        growthType: 'Balanced',
        viewsPanel: defaultPanelId,
        likesPanel: defaultPanelId,
        viewsServiceId: '1001',
        likesServiceId: '1002',
        minViewsPerCycle: 1000,
        maxViewsPerCycle: 3000,
        maxViewsTotal: 100000,
        viewsRandomizationPct: 15,
        accelerationCurve: 'Balanced',
        likesStartTick: 3,
        minLikesPerCycle: 30,
        maxLikesPerCycle: 80,
        likesTotalHits: 1000,
        likesDelayMins: 20,
        enableComments: true,
        commentsStartTick: 4,
        minCommentsPerCycle: 2,
        maxCommentsPerCycle: 5,
        commentsDelayMins: 30,
        minGapMins: 20,
        maxGapMins: 60,
      },
      {
        name: 'Viral Template Default',
        description: 'High velocity viral boost targeting up to 500K views.',
        category: 'Viral',
        growthType: 'Aggressive',
        viewsPanel: defaultPanelId,
        likesPanel: defaultPanelId,
        viewsServiceId: '1001',
        likesServiceId: '1002',
        minViewsPerCycle: 3000,
        maxViewsPerCycle: 10000,
        maxViewsTotal: 500000,
        viewsRandomizationPct: 20,
        accelerationCurve: 'Balanced',
        likesStartTick: 2,
        minLikesPerCycle: 100,
        maxLikesPerCycle: 300,
        likesTotalHits: 5000,
        likesDelayMins: 15,
        enableComments: true,
        commentsStartTick: 3,
        minCommentsPerCycle: 5,
        maxCommentsPerCycle: 15,
        commentsDelayMins: 20,
        minGapMins: 10,
        maxGapMins: 30,
      },
      {
        name: 'Elite Template Default',
        description: 'Elite scaling targeting up to 1,000,000 (1M) maximum views.',
        category: 'Elite',
        growthType: 'Aggressive',
        viewsPanel: defaultPanelId,
        likesPanel: defaultPanelId,
        viewsServiceId: '1001',
        likesServiceId: '1002',
        minViewsPerCycle: 10000,
        maxViewsPerCycle: 35000,
        maxViewsTotal: 1000000,
        viewsRandomizationPct: 20,
        accelerationCurve: 'Balanced',
        likesStartTick: 2,
        minLikesPerCycle: 500,
        maxLikesPerCycle: 1500,
        likesTotalHits: 15000,
        likesDelayMins: 15,
        enableComments: true,
        commentsStartTick: 3,
        minCommentsPerCycle: 10,
        maxCommentsPerCycle: 30,
        commentsDelayMins: 20,
        minGapMins: 5,
        maxGapMins: 15,
      },
      // --- BULK TARGET PRESET TEMPLATES ---
      {
        name: 'Bulk Starter Preset Default',
        description: 'Starter bulk target preset, aiming for a total views range of 1K–5K. Optimised with proportional, safe likes bounds to prevent spam detection.',
        type: 'bulk',
        category: 'Starter',
        growthType: 'Balanced',
        viewsPanel: defaultPanelId,
        likesPanel: defaultPanelId,
        commentsPanel: defaultPanelId,
        sharesPanel: defaultPanelId,
        viewsServiceId: '1001',
        likesServiceId: '1002',
        commentsServiceId: '1003',
        sharesServiceId: '1004',
        minViewsPerCycle: 100,
        maxViewsPerCycle: 250,
        minViewsTotal: 1000,
        maxViewsTotal: 5000,
        minLikesTotal: 50,
        maxLikesTotal: 250,
        minGapMins: 45,
        maxGapMins: 90,
      },
      {
        name: 'Bulk Growth Preset Default',
        description: 'Mid-stage scaling bulk preset targeting a total of 5K–25K views. Includes balanced automatic comments and shares ranges.',
        type: 'bulk',
        category: 'Growth',
        growthType: 'Balanced',
        viewsPanel: defaultPanelId,
        likesPanel: defaultPanelId,
        commentsPanel: defaultPanelId,
        sharesPanel: defaultPanelId,
        viewsServiceId: '1001',
        likesServiceId: '1002',
        commentsServiceId: '1003',
        sharesServiceId: '1004',
        minViewsPerCycle: 300,
        maxViewsPerCycle: 800,
        minViewsTotal: 5000,
        maxViewsTotal: 25000,
        minLikesTotal: 250,
        maxLikesTotal: 1250,
        enableComments: true,
        commentsStartTick: 3,
        minCommentsTotal: 10,
        maxCommentsTotal: 50,
        enableShares: true,
        sharesStartTick: 2,
        minSharesTotal: 25,
        maxSharesTotal: 125,
        minGapMins: 30,
        maxGapMins: 90,
      },
      {
        name: 'Bulk Momentum Preset Default',
        description: 'Heavy engagement bulk preset targeting a total views scale of 25K–100K. Distributes likes, comments, and shares across cycles dynamically.',
        type: 'bulk',
        category: 'Momentum',
        growthType: 'Balanced',
        viewsPanel: defaultPanelId,
        likesPanel: defaultPanelId,
        commentsPanel: defaultPanelId,
        sharesPanel: defaultPanelId,
        viewsServiceId: '1001',
        likesServiceId: '1002',
        commentsServiceId: '1003',
        sharesServiceId: '1004',
        minViewsPerCycle: 1000,
        maxViewsPerCycle: 3000,
        minViewsTotal: 25000,
        maxViewsTotal: 100000,
        minLikesTotal: 1250,
        maxLikesTotal: 5000,
        enableComments: true,
        commentsStartTick: 3,
        minCommentsTotal: 50,
        maxCommentsTotal: 200,
        enableShares: true,
        sharesStartTick: 2,
        minSharesTotal: 125,
        maxSharesTotal: 500,
        minGapMins: 20,
        maxGapMins: 60,
      },
      {
        name: 'Bulk Viral Preset Default',
        description: 'Viral explosion bulk distribution template boosting total views up to 100K–500K with highly proportional engagement spikes.',
        type: 'bulk',
        category: 'Viral',
        growthType: 'Aggressive',
        viewsPanel: defaultPanelId,
        likesPanel: defaultPanelId,
        commentsPanel: defaultPanelId,
        sharesPanel: defaultPanelId,
        viewsServiceId: '1001',
        likesServiceId: '1002',
        commentsServiceId: '1003',
        sharesServiceId: '1004',
        minViewsPerCycle: 3000,
        maxViewsPerCycle: 10000,
        minViewsTotal: 100000,
        maxViewsTotal: 500000,
        minLikesTotal: 5000,
        maxLikesTotal: 25000,
        enableComments: true,
        commentsStartTick: 2,
        minCommentsTotal: 200,
        maxCommentsTotal: 1000,
        enableShares: true,
        sharesStartTick: 2,
        minSharesTotal: 500,
        maxSharesTotal: 2500,
        minGapMins: 10,
        maxGapMins: 30,
      },
      {
        name: 'Bulk Elite Preset Default',
        description: 'Elite scaling engine targeting high-volume bulk campaigns between 500K–1M+ total views and top-tier metrics.',
        type: 'bulk',
        category: 'Elite',
        growthType: 'Aggressive',
        viewsPanel: defaultPanelId,
        likesPanel: defaultPanelId,
        commentsPanel: defaultPanelId,
        sharesPanel: defaultPanelId,
        viewsServiceId: '1001',
        likesServiceId: '1002',
        commentsServiceId: '1003',
        sharesServiceId: '1004',
        minViewsPerCycle: 10000,
        maxViewsPerCycle: 35000,
        minViewsTotal: 500000,
        maxViewsTotal: 1000000,
        minLikesTotal: 25000,
        maxLikesTotal: 50000,
        enableComments: true,
        commentsStartTick: 2,
        minCommentsTotal: 1000,
        maxCommentsTotal: 2000,
        enableShares: true,
        sharesStartTick: 2,
        minSharesTotal: 2500,
        maxSharesTotal: 5000,
        minGapMins: 5,
        maxGapMins: 15,
      }
    ];

    let seedCount = 0;
    for (const preset of presets) {
      const exists = await Template.findOne({ name: preset.name });
      if (!exists) {
        await Template.create(preset);
        seedCount++;
      }
    }

    if (seedCount > 0) {
      console.log(`[Seeder] Seeded ${seedCount} default progression templates successfully!`);
    } else {
      console.log('[Seeder] All default templates already exist in database.');
    }
  } catch (err) {
    console.error('[Seeder] Error seeding templates:', err.message);
  }
}

// ─── Database & Server Start ─────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    maxPoolSize: 10,
  })
  .then(async () => {
    console.log('[DB] Connected to MongoDB');

    // Seed default presets templates
    await seedDefaultTemplates();

    // Start Agenda job processor in the same process
    await startAgenda(io);

    // ─── MongoDB Change Streams for Real-time Socket.io Updates ──────────────────
    // This allows the Web Service to emit progress updates even if the Worker 
    // is the one updating the database.
    const orderCollection = mongoose.connection.collection('orders');
    const changeStream = orderCollection.watch();

    changeStream.on('error', (err) => {
      console.error('[ChangeStream Error]', err.message);
    });

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
