// src/models/Template.js
const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    type: {
      type: String,
      enum: ['single', 'bulk'],
      required: true,
      default: 'single',
      index: true
    },
    category: {
      type: String,
      enum: ['Starter', 'Growth', 'Momentum', 'Viral', 'Elite'],
      required: true,
      default: 'Starter',
      index: true
    },
    platform: {
      type: String,
      enum: ['Instagram', 'TikTok', 'YouTube', 'Facebook'],
      default: 'Instagram',
      index: true
    },
    growthType: {
      type: String,
      enum: ['Conservative', 'Balanced', 'Aggressive', 'Viral'],
      required: true,
      default: 'Balanced'
    },
    engagementMode: {
      type: String,
      enum: ['fixed', 'percentage'],
      default: 'fixed'
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
    maxViewsTotal: { type: Number, min: 0, default: 5000 },
    
    // Bulk Target Ranges
    minViewsTotal: { type: Number, default: 0 },
    minLikesTotal: { type: Number, default: 0 },
    maxLikesTotal: { type: Number, default: 0 },
    minCommentsTotal: { type: Number, default: 0 },
    maxCommentsTotal: { type: Number, default: 0 },
    minSharesTotal: { type: Number, default: 0 },
    maxSharesTotal: { type: Number, default: 0 },

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
    totalLikes: { type: Number, default: 0 },
    likesTotalHits: { type: Number, default: 0, min: 0 }, // Random hits
    likesDelayMins: { type: Number, default: 0, min: 0 }, // Likes delay
    likesRatioMin: { type: Number, default: 3.0, min: 0 },
    likesRatioMax: { type: Number, default: 5.0, min: 0 },
    maxLikeRatioPct: { type: Number, default: 10.0 },

    // Comments Configuration
    enableComments: { type: Boolean, default: false },
    minCommentsPerCycle: { type: Number, default: 2, min: 0 },
    maxCommentsPerCycle: { type: Number, default: 5, min: 0 },
    commentsStartTick: { type: Number, default: 3, min: 1 },
    commentsDelayMins: { type: Number, default: 0, min: 0 },
    commentsRatioMin: { type: Number, default: 0.3, min: 0 },
    commentsRatioMax: { type: Number, default: 0.8, min: 0 },
    maxCommentRatioPct: { type: Number, default: 3.0 },

    // Shares Configuration
    enableShares: { type: Boolean, default: false },
    minSharesPerCycle: { type: Number, default: 5, min: 0 },
    maxSharesPerCycle: { type: Number, default: 15, min: 0 },
    sharesStartTick: { type: Number, default: 2, min: 1 },
    sharesDelayMins: { type: Number, default: 0, min: 0 },
    sharesRatioMin: { type: Number, default: 0.2, min: 0 },
    sharesRatioMax: { type: Number, default: 0.6, min: 0 },
    maxShareRatioPct: { type: Number, default: 2.0 },
    engagementVariancePct: { type: Number, default: 10.0, min: 0, max: 100 },

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
