// src/routes/panels.js
const express = require('express');
const router = express.Router();
const Panel = require('../models/Panel');

// GET /api/panels
router.get('/', async (req, res) => {
  try {
    const panels = await Panel.find().sort({ createdAt: -1 });
    res.json({ success: true, data: panels });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/panels/:id
router.get('/:id', async (req, res) => {
  try {
    const panel = await Panel.findById(req.params.id);
    if (!panel) return res.status(404).json({ success: false, error: 'Panel not found' });
    res.json({ success: true, data: panel });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/panels
router.post('/', async (req, res) => {
  try {
    const { name, apiUrl, apiKey, isDefault, isActive } = req.body;
    
    // Auto-set as default if it's the first panel
    const count = await Panel.countDocuments();
    const shouldBeDefault = count === 0 ? true : !!isDefault;

    const panel = await Panel.create({
      name, apiUrl, apiKey,
      isDefault: shouldBeDefault,
      isActive: isActive !== false
    });
    
    res.status(201).json({ success: true, data: panel });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/panels/:id
router.put('/:id', async (req, res) => {
  try {
    const panel = await Panel.findById(req.params.id);
    if (!panel) return res.status(404).json({ success: false, error: 'Panel not found' });
    
    Object.assign(panel, req.body);
    await panel.save(); // using .save() to trigger the pre-save hook for defaults
    
    res.json({ success: true, data: panel });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/panels/:id
router.delete('/:id', async (req, res) => {
  try {
    const panel = await Panel.findByIdAndDelete(req.params.id);
    if (!panel) return res.status(404).json({ success: false, error: 'Panel not found' });
    
    // If we deleted the default panel, make another one default if it exists
    if (panel.isDefault) {
      const nextPanel = await Panel.findOne();
      if (nextPanel) {
        nextPanel.isDefault = true;
        await nextPanel.save();
      }
    }
    
    res.json({ success: true, message: 'Panel deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
