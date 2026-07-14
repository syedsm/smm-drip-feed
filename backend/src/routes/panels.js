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

const MOCK_SERVICES = [
  // Views
  { service: '11271', name: 'Instagram Views [High Retention] - 100% Organic Speed', category: 'Views' },
  { service: '11275', name: 'Instagram Views [Real User] - Recommended', category: 'Views' },
  { service: '11301', name: 'Instagram Views [Bulk Instant] - Cost Effective', category: 'Views' },
  // Likes
  { service: '4421', name: 'Instagram Likes [Steady Speeds] - Max 5K/day', category: 'Likes' },
  { service: '4423', name: 'Instagram Likes [Real Accounts] - Active', category: 'Likes' },
  { service: '4427', name: 'Instagram Likes [Instant Delivery] - Cheap', category: 'Likes' },
  // Comments
  { service: '772', name: 'Instagram Custom Comments - Random Text', category: 'Comments' },
  { service: '773', name: 'Instagram Comments [Emojified Only] - Pop', category: 'Comments' },
  { service: '775', name: 'Instagram Thread Replies - Standard', category: 'Comments' },
  // Shares
  { service: '912', name: 'Instagram Shares [Profile Extractor]', category: 'Shares' },
  { service: '915', name: 'Instagram Shares [Direct Messages]', category: 'Shares' },
  { service: '919', name: 'Instagram Shares [Bulk Feed]', category: 'Shares' },
];

// GET /api/panels/:id/services
router.get('/:id/services', async (req, res) => {
  try {
    const Panel = require('../models/Panel');
    const panel = await Panel.findById(req.params.id);
    if (!panel) return res.status(404).json({ success: false, error: 'Panel not found' });

    // Dry-run/Mock mode checking
    if (process.env.NODE_ENV !== 'production' || !panel.apiUrl || panel.apiUrl.includes('example')) {
      return res.json({ success: true, services: MOCK_SERVICES });
    }

    // Call SMM API
    const axios = require('axios');
    const response = await axios.post(
      panel.apiUrl,
      new URLSearchParams({ key: panel.apiKey, action: 'services' }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 15000 }
    );

    let services = [];
    if (Array.isArray(response.data)) {
      services = response.data.map(s => ({
        service: String(s.service),
        name: s.name,
        category: s.type || s.category || 'Other'
      }));
    } else if (response.data && typeof response.data === 'object') {
      // Map other formats
      services = Object.values(response.data).map(s => ({
        service: String(s.service),
        name: s.name,
        category: s.type || s.category || 'Other'
      }));
    }
    
    if (services.length === 0) {
      return res.json({ success: true, services: MOCK_SERVICES });
    }

    res.json({ success: true, services });
  } catch (err) {
    res.json({ success: true, services: MOCK_SERVICES, note: 'Failed to fetch real panel services, returned mock services' });
  }
});

module.exports = router;
