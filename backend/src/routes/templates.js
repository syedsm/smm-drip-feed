// src/routes/templates.js
const express = require('express');
const router = express.Router();
const Template = require('../models/Template');

// GET /api/templates
router.get('/', async (req, res) => {
  try {
    const templates = await Template.find()
      .populate('viewsPanel', 'name')
      .populate('likesPanel', 'name')
      .populate('commentsPanel', 'name')
      .populate('sharesPanel', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: templates });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/templates/:id
router.get('/:id', async (req, res) => {
  try {
    const template = await Template.findById(req.params.id)
      .populate('viewsPanel', 'name')
      .populate('likesPanel', 'name')
      .populate('commentsPanel', 'name')
      .populate('sharesPanel', 'name');
    if (!template) return res.status(404).json({ success: false, error: 'Template not found' });
    res.json({ success: true, data: template });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/templates
router.post('/', async (req, res) => {
  try {
    const body = req.body;

    // Basic validation
    if (!body.name) {
      return res.status(400).json({ success: false, error: 'Template name is required' });
    }
    if (body.minViewsPerCycle && body.maxViewsPerCycle && parseInt(body.minViewsPerCycle) > parseInt(body.maxViewsPerCycle)) {
      return res.status(400).json({ success: false, error: 'minViewsPerCycle cannot be > maxViewsPerCycle' });
    }
    if (body.minLikesPerCycle && body.maxLikesPerCycle && parseInt(body.minLikesPerCycle) > parseInt(body.maxLikesPerCycle)) {
      return res.status(400).json({ success: false, error: 'minLikesPerCycle cannot be > maxLikesPerCycle' });
    }
    if (body.minGapMins && body.maxGapMins && parseInt(body.minGapMins) > parseInt(body.maxGapMins)) {
      return res.status(400).json({ success: false, error: 'minGapMins cannot be > maxGapMins' });
    }
    if (body.enableComments && body.minCommentsPerCycle && body.maxCommentsPerCycle && parseInt(body.minCommentsPerCycle) > parseInt(body.maxCommentsPerCycle)) {
      return res.status(400).json({ success: false, error: 'minCommentsPerCycle cannot be > maxCommentsPerCycle' });
    }
    if (body.enableShares && body.minSharesPerCycle && body.maxSharesPerCycle && parseInt(body.minSharesPerCycle) > parseInt(body.maxSharesPerCycle)) {
      return res.status(400).json({ success: false, error: 'minSharesPerCycle cannot be > maxSharesPerCycle' });
    }

    const template = await Template.create(body);
    
    // Populate refs before returning
    const populated = await Template.findById(template._id)
      .populate('viewsPanel', 'name')
      .populate('likesPanel', 'name')
      .populate('commentsPanel', 'name')
      .populate('sharesPanel', 'name');

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/templates/:id
router.put('/:id', async (req, res) => {
  try {
    const body = req.body;

    if (body.minViewsPerCycle && body.maxViewsPerCycle && parseInt(body.minViewsPerCycle) > parseInt(body.maxViewsPerCycle)) {
      return res.status(400).json({ success: false, error: 'minViewsPerCycle cannot be > maxViewsPerCycle' });
    }
    if (body.minLikesPerCycle !== undefined && body.maxLikesPerCycle !== undefined && parseInt(body.minLikesPerCycle) > parseInt(body.maxLikesPerCycle)) {
      return res.status(400).json({ success: false, error: 'minLikesPerCycle cannot be > maxLikesPerCycle' });
    }
    if (body.minGapMins && body.maxGapMins && parseInt(body.minGapMins) > parseInt(body.maxGapMins)) {
      return res.status(400).json({ success: false, error: 'minGapMins cannot be > maxGapMins' });
    }
    if (body.enableComments && body.minCommentsPerCycle && body.maxCommentsPerCycle && parseInt(body.minCommentsPerCycle) > parseInt(body.maxCommentsPerCycle)) {
      return res.status(400).json({ success: false, error: 'minCommentsPerCycle cannot be > maxCommentsPerCycle' });
    }
    if (body.enableShares && body.minSharesPerCycle && body.maxSharesPerCycle && parseInt(body.minSharesPerCycle) > parseInt(body.maxSharesPerCycle)) {
      return res.status(400).json({ success: false, error: 'minSharesPerCycle cannot be > maxSharesPerCycle' });
    }

    const template = await Template.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true })
      .populate('viewsPanel', 'name')
      .populate('likesPanel', 'name')
      .populate('commentsPanel', 'name')
      .populate('sharesPanel', 'name');

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
