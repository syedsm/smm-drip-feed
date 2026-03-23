// src/models/Template.js
const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    minViewsPerCycle: { type: Number, required: true, min: 1 },
    maxViewsPerCycle: { type: Number, required: true, min: 1 },
    maxViewsTotal: { type: Number, required: true, min: 1 },
    minLikesPerCycle: { type: Number, required: true, min: 0 },
    maxLikesPerCycle: { type: Number, required: true, min: 0 },
    minGapMins: { type: Number, required: true, min: 1 },
    maxGapMins: { type: Number, required: true, min: 1 },
    likesStartTick: { type: Number, default: 1, min: 1 },
    totalHits: { type: Number, default: 0, min: 0 },
    totalLikes: { type: Number, default: 0, min: 0 },
    viewsServiceId: { type: String, required: true, trim: true },
    likesServiceId: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Template', templateSchema);
