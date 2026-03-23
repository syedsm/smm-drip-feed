// src/models/DeliveryLog.js
const mongoose = require('mongoose');

const deliveryLogSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    tick: { type: Number, required: true },
    views: { type: Number, required: true },
    likes: { type: Number, required: true },
    viewsApiResponse: { type: mongoose.Schema.Types.Mixed, default: null },
    likesApiResponse: { type: mongoose.Schema.Types.Mixed, default: null },
    success: { type: Boolean, default: true },
    errorMessage: { type: String, default: null },
    deliveredAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// Compound index for efficient per-order log queries
deliveryLogSchema.index({ order: 1, deliveredAt: 1 });
deliveryLogSchema.index({ order: 1, tick: 1 });

module.exports = mongoose.model('DeliveryLog', deliveryLogSchema);
