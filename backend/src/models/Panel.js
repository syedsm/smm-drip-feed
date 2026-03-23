// src/models/Panel.js
const mongoose = require('mongoose');

const panelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    apiUrl: { type: String, required: true, trim: true },
    apiKey: { type: String, required: true, trim: true },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Middleware to ensure only one default panel exists
panelSchema.pre('save', async function () {
  if (this.isDefault) {
    await this.constructor.updateMany({ _id: { $ne: this._id } }, { isDefault: false });
  }
});

module.exports = mongoose.model('Panel', panelSchema);
