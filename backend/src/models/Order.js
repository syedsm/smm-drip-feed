// src/models/Order.js
const mongoose = require('mongoose');

const deliverySlotSchema = new mongoose.Schema(
  {
    tick: { type: Number, required: true },
    scheduledAt: { type: Date, required: true },
    views: { type: Number, required: true },
    likes: { type: Number, required: true },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    delivered: { type: Boolean, default: false },
    processing: { type: Boolean, default: false },
    viewsOrderId: { type: String, default: null },
    likesOrderId: { type: String, default: null },
    commentsOrderId: { type: String, default: null },
    sharesOrderId: { type: String, default: null },
    viewsError: { type: String, default: null },
    likesError: { type: String, default: null },
    commentsError: { type: String, default: null },
    sharesError: { type: String, default: null },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    socialLink: { type: String, required: true, trim: true },
    platform: {
      type: String,
      enum: ['instagram', 'youtube', 'tiktok', 'twitter', 'facebook', 'other'],
      default: 'other',
    },
    panel: { type: mongoose.Schema.Types.ObjectId, ref: 'Panel', required: true },
    viewsServiceId: { type: String, required: true },
    likesServiceId: { type: String, required: true },
    commentsServiceId: { type: String, default: null },
    sharesServiceId: { type: String, default: null },
    viewsPanel: { type: mongoose.Schema.Types.ObjectId, ref: 'Panel', default: null },
    likesPanel: { type: mongoose.Schema.Types.ObjectId, ref: 'Panel', default: null },
    commentsPanel: { type: mongoose.Schema.Types.ObjectId, ref: 'Panel', default: null },
    sharesPanel: { type: mongoose.Schema.Types.ObjectId, ref: 'Panel', default: null },
    template: { type: mongoose.Schema.Types.ObjectId, ref: 'Template', default: null },
    customRules: {
      minViewsPerCycle: Number, maxViewsPerCycle: Number, maxViewsTotal: Number,
      minLikesPerCycle: Number, maxLikesPerCycle: Number,
      minGapMins: Number, maxGapMins: Number,
      likesStartTick: Number,
      totalLikes: Number,
      totalHits: Number,
    },
    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed', 'paused', 'active'],
      default: 'active',
      index: true,
    },
    botStatus: { type: String, default: 'Initializing...' },
    totalViews: { type: Number, required: true },
    totalLikes: { type: Number, required: true },
    totalComments: { type: Number, default: 0 },
    totalShares: { type: Number, default: 0 },
    deliveredViews: { type: Number, default: 0 },
    deliveredLikes: { type: Number, default: 0 },
    deliveredComments: { type: Number, default: 0 },
    deliveredShares: { type: Number, default: 0 },
    totalTicks: { type: Number, required: true },
    completedTicks: { type: Number, default: 0 },
    schedule: [deliverySlotSchema],
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    notes: { type: String, default: '' },
    dripInterval: { type: Number, default: 30 },
    nextDripAt: { type: Date },
    startDelay: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Compound indexes for efficient queries
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ template: 1, status: 1 });
orderSchema.index({ status: 1, nextDripAt: 1 });

module.exports = mongoose.model('Order', orderSchema);
