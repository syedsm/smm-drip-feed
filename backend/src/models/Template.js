// src/models/Template.js
const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: {
      type: String,
      enum: ['Starter', 'Growth', 'Momentum', 'Viral', 'Elite'],
      required: true,
      default: 'Starter',
      index: true
    },
    growthType: {
      type: String,
      enum: ['Slow Organic', 'Balanced', 'Aggressive', 'Custom'],
      required: true,
      default: 'Balanced'
    },
    
    // Service Panels Selection
    viewsPanel: { type: mongoose.Schema.Types.ObjectId, ref: 'Panel', default: null },
    likesPanel: { type: mongoose.Schema.Types.ObjectId, ref: 'Panel', default: null },
    commentsPanel: { type: mongoose.Schema.Types.ObjectId, ref: 'Panel', default: null },
    sharesPanel: { type: mongoose.Schema.Types.ObjectId, ref: 'Panel', default: null },

    // Service IDs Configuration
    viewsServiceId: { type: String, required: true, trim: true },
    likesServiceId: { type: String, default: '', trim: true },
    commentsServiceId: { type: String, default: '', trim: true },
    sharesServiceId: { type: String, default: '', trim: true },

    // Views Configuration
    minViewsPerCycle: { type: Number, required: true, min: 1, default: 100 },
    maxViewsPerCycle: { type: Number, required: true, min: 1, default: 250 },
    maxViewsTotal: { type: Number, required: true, min: 1, default: 5000 },
    viewsRandomizationPct: { type: Number, default: 10, min: 0, max: 100 },
    viewsPauseLogic: { type: Boolean, default: false },
    accelerationCurve: {
      type: String,
      enum: ['Slow Start', 'Balanced', 'Fast Push', 'Custom'],
      default: 'Balanced'
    },

    // Likes Configuration
    likesStartTick: { type: Number, default: 3, min: 1 },
    minLikesPerCycle: { type: Number, default: 0, min: 0 },
    maxLikesPerCycle: { type: Number, default: 0, min: 0 },
    likesTotalHits: { type: Number, default: 0, min: 0 }, // Random hits
    likesDelayMins: { type: Number, default: 0, min: 0 }, // Likes delay

    // Comments Configuration
    enableComments: { type: Boolean, default: false },
    minCommentsPerCycle: { type: Number, default: 2, min: 0 },
    maxCommentsPerCycle: { type: Number, default: 5, min: 0 },
    commentsStartTick: { type: Number, default: 3, min: 1 },
    commentsDelayMins: { type: Number, default: 0, min: 0 },

    // Shares Configuration
    enableShares: { type: Boolean, default: false },
    minSharesPerCycle: { type: Number, default: 5, min: 0 },
    maxSharesPerCycle: { type: Number, default: 15, min: 0 },
    sharesStartTick: { type: Number, default: 2, min: 1 },
    sharesDelayMins: { type: Number, default: 0, min: 0 },

    // Timing Configuration
    minGapMins: { type: Number, required: true, min: 1, default: 60 },
    maxGapMins: { type: Number, required: true, min: 1, default: 120 },
    workingHoursEnabled: { type: Boolean, default: false },
    workingHoursStart: { type: String, default: '09:00' },
    workingHoursEnd: { type: String, default: '17:00' },
    pauseBetweenCycles: { type: Boolean, default: false },

    // Advanced Settings
    randomizeEverything: { type: Boolean, default: false },
    smartDistribution: { type: Boolean, default: true },
    skipDeadCycles: { type: Boolean, default: true },
    retryFailedOrders: { type: Boolean, default: false },
    autoStop: { type: Boolean, default: false },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Template', templateSchema);
