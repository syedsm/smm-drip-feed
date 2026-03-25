// src/workers/agendaWorker.js
const mongoose = require('mongoose');
require('dotenv').config();
const { startAgenda } = require('../config/agenda');

// Pre-register models for Mongoose
require('../models/Order');
require('../models/Panel');
require('../models/Template');
require('../models/DeliveryLog');

async function runWorker() {
  try {
    console.log('[Worker] Starting Background Worker...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 5, // Smaller pool for worker
    });
    console.log('[Worker] Connected to MongoDB');

    // Start Agenda (this will define jobs and call .start())
    // No 'io' instance here as worker doesn't run Socket.io server
    await startAgenda(null);

    console.log('[Worker] Background Worker is now running 24/7');

    // Handle graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('[Worker] SIGTERM received. Shutting down...');
      await mongoose.connection.close();
      process.exit(0);
    });

  } catch (err) {
    console.error('[Worker] Fatal Error during startup:', err.message);
    process.exit(1);
  }
}

runWorker();
