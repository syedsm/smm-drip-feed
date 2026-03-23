// src/routes/templates.js
const express = require('express');
const router = express.Router();
const Template = require('../models/Template');

// GET /api/templates
router.get('/', async (req, res) => {
  try {
    const templates = await Template.find().sort({ createdAt: -1 });
    res.json({ success: true, data: templates });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/templates/:id
router.get('/:id', async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) return res.status(404).json({ success: false, error: 'Template not found' });
    res.json({ success: true, data: template });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/templates
router.post('/', async (req, res) => {
  try {
    const { name, minViewsPerCycle, maxViewsPerCycle, maxViewsTotal, minLikesPerCycle, maxLikesPerCycle, minGapMins, maxGapMins, description, viewsServiceId, likesServiceId, likesStartTick, minTotalLikes, maxTotalLikes } = req.body;

    // Basic validation
    if (!name || !minViewsPerCycle || !maxViewsPerCycle || !maxViewsTotal || minLikesPerCycle === undefined || maxLikesPerCycle === undefined) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    if (minViewsPerCycle > maxViewsPerCycle) return res.status(400).json({ success: false, error: 'minViewsPerCycle cannot be > maxViewsPerCycle' });
    if (minLikesPerCycle > maxLikesPerCycle) return res.status(400).json({ success: false, error: 'minLikesPerCycle cannot be > maxLikesPerCycle' });
    if (minGapMins > maxGapMins) return res.status(400).json({ success: false, error: 'minGapMins cannot be > maxGapMins' });

    const template = await Template.create({
      name, minViewsPerCycle, maxViewsPerCycle, maxViewsTotal, minLikesPerCycle, maxLikesPerCycle, minGapMins, maxGapMins, description, viewsServiceId, likesServiceId, likesStartTick, minTotalLikes, maxTotalLikes
    });
    
    res.status(201).json({ success: true, data: template });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/templates/:id
router.put('/:id', async (req, res) => {
  try {
    const { minViewsPerCycle, maxViewsPerCycle, maxViewsTotal, minLikesPerCycle, maxLikesPerCycle, minGapMins, maxGapMins, viewsServiceId, likesServiceId, likesStartTick, minTotalLikes, maxTotalLikes } = req.body;

    if (minViewsPerCycle && maxViewsPerCycle && minViewsPerCycle > maxViewsPerCycle) {
      return res.status(400).json({ success: false, error: 'minViewsPerCycle cannot be > maxViewsPerCycle' });
    }
    if (minLikesPerCycle !== undefined && maxLikesPerCycle !== undefined && minLikesPerCycle > maxLikesPerCycle) {
      return res.status(400).json({ success: false, error: 'minLikesPerCycle cannot be > maxLikesPerCycle' });
    }
    if (minGapMins && maxGapMins && minGapMins > maxGapMins) {
      return res.status(400).json({ success: false, error: 'minGapMins cannot be > maxGapMins' });
    }
    const template = await Template.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!template) return res.status(404).json({ success: false, error: 'Template not found' });
    res.json({ success: true, data: template });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/templates/:id
router.delete('/:id', async (req, res) => {
  try {
    const template = await Template.findByIdAndDelete(req.params.id);
    if (!template) return res.status(404).json({ success: false, error: 'Template not found' });
    res.json({ success: true, message: 'Template deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
