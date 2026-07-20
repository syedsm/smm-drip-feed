// src/routes/orders.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Template = require('../models/Template');
const DeliveryLog = require('../models/DeliveryLog');
const { generateSchedule, randInt } = require('../services/graphAlgorithm');

const DEFAULT_TICKS = 10; // Default number of delivery rounds

// GET /api/orders
router.get('/', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { status } : {};
    const orders = await Order.find(filter)
      .populate('template', 'name minViewsPerCycle maxViewsPerCycle maxViewsTotal minGapMins maxGapMins')
      .populate('panel', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const total = await Order.countDocuments(filter);
    res.json({ success: true, data: orders, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/orders/:id
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('template')
      .populate('panel', 'name');
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    // Fetch delivery logs for this order
    const logs = await DeliveryLog.find({ order: order._id }).sort({ deliveredAt: 1 });

    res.json({ success: true, data: order, logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/orders
router.post('/', async (req, res) => {
  try {
    const { links, platform, templateId, customRules, panelId, viewsServiceId, likesServiceId, notes, startDelay = 0 } = req.body;

    if (!links || !Array.isArray(links) || links.length === 0) {
      return res.status(400).json({ success: false, error: 'Array of links is required' });
    }
    if (!panelId) return res.status(400).json({ success: false, error: 'Panel ID is required' });
    if (!templateId) return res.status(400).json({ success: false, error: 'templateId is mandatory. Orders must pass through a template.' });

    const template = await Template.findById(templateId);
    if (!template) return res.status(404).json({ success: false, error: 'Template not found' });
    
    // Explicitly use service IDs from the template
    const actualViewsServiceId = template.viewsServiceId;
    const actualLikesServiceId = template.likesServiceId;
    const actualCommentsServiceId = template.enableComments ? template.commentsServiceId : null;
    const actualSharesServiceId = template.enableShares ? template.sharesServiceId : null;

    if (!actualViewsServiceId) {
      return res.status(400).json({ success: false, error: 'The selected template is missing Views Service ID. Please update the template first.' });
    }

    if (template.enableComments && !actualCommentsServiceId) {
      return res.status(400).json({ success: false, error: 'The selected template has Comments enabled but is missing Comments Service ID.' });
    }

    if (template.enableShares && !actualSharesServiceId) {
      return res.status(400).json({ success: false, error: 'The selected template has Shares enabled but is missing Shares Service ID.' });
    }

    const viewsPanel = template.viewsPanel || panelId;
    const likesPanel = template.likesPanel || panelId;
    const commentsPanel = template.enableComments ? (template.commentsPanel || panelId) : null;
    const sharesPanel = template.enableShares ? (template.sharesPanel || panelId) : null;

    const templateConfig = {
      ...template.toObject(),
      ...(!actualLikesServiceId ? { minLikesPerCycle: 0, maxLikesPerCycle: 0, totalLikes: 0, totalHits: 0 } : {})
    };

    const ordersToCreate = [];

    // Calculate initial start time based on delay
    const baseStartTime = new Date(Date.now() + (parseInt(startDelay) || 0) * 60000);

    // Process each link individually
    for (const linkObj of links) {
      let cleanedLink = '';
      let customViews = null;
      let customLikes = null;
      let customComments = null;
      let customShares = null;

      if (linkObj && typeof linkObj === 'object') {
        cleanedLink = linkObj.url ? linkObj.url.trim() : '';
        customViews = Number(linkObj.totalViews);
        customLikes = Number(linkObj.totalLikes);
        customComments = Number(linkObj.totalComments);
        customShares = Number(linkObj.totalShares);
      } else if (typeof linkObj === 'string') {
        cleanedLink = linkObj.trim();
      }

      if (!cleanedLink) continue;

      let linkConfig = { ...templateConfig };
      
      // Determine views target dynamically per clip/link
      const viewsMax = template.maxViewsTotal || 1000;
      const viewsMin = template.minViewsTotal || viewsMax;
      const randViews = (customViews !== null && !isNaN(customViews) && customViews > 0)
        ? customViews
        : (viewsMin === viewsMax ? viewsMax : randInt(viewsMin, viewsMax));
      linkConfig.maxViewsTotal = randViews;

      // Determine likes target dynamically per clip/link
      if (actualLikesServiceId) {
        const likesMax = template.maxLikesTotal || 0;
        const likesMin = template.minLikesTotal || likesMax;
        const randLikes = (customLikes !== null && !isNaN(customLikes) && customLikes > 0)
          ? customLikes
          : (likesMin === likesMax ? likesMax : randInt(likesMin, likesMax));
        linkConfig.totalLikes = randLikes;
      } else {
        linkConfig.totalLikes = 0;
      }

      // Determine comments target dynamically per clip/link
      if (template.enableComments && actualCommentsServiceId) {
        const commentsMax = template.maxCommentsTotal || 0;
        const commentsMin = template.minCommentsTotal || commentsMax;
        const randComments = (customComments !== null && !isNaN(customComments) && customComments > 0)
          ? customComments
          : (commentsMin === commentsMax ? commentsMax : randInt(commentsMin, commentsMax));
        linkConfig.totalComments = randComments;
      } else {
        linkConfig.totalComments = 0;
      }

      // Determine shares target dynamically per clip/link
      if (template.enableShares && actualSharesServiceId) {
        const sharesMax = template.maxSharesTotal || 0;
        const sharesMin = template.minSharesTotal || sharesMax;
        const randShares = (customShares !== null && !isNaN(customShares) && customShares > 0)
          ? customShares
          : (sharesMin === sharesMax ? sharesMax : randInt(sharesMin, sharesMax));
        linkConfig.totalShares = randShares;
      } else {
        linkConfig.totalShares = 0;
      }

      // Pass baseStartTime to algorithm
      const { totalViews, totalLikes, totalComments, totalShares, schedule } = generateSchedule(linkConfig, baseStartTime);

      ordersToCreate.push({
        socialLink: cleanedLink,
        platform: platform || 'other',
        panel: panelId,
        viewsPanel,
        likesPanel,
        commentsPanel,
        sharesPanel,
        viewsServiceId: actualViewsServiceId,
        likesServiceId: actualLikesServiceId,
        commentsServiceId: actualCommentsServiceId,
        sharesServiceId: actualSharesServiceId,
        template: templateId,
        customRules: templateId ? undefined : customRules,
        totalViews,
        totalLikes,
        totalComments,
        totalShares,
        totalTicks: schedule.length,
        schedule,
        status: 'active',
        nextDripAt: schedule[0]?.scheduledAt || baseStartTime,
        startedAt: baseStartTime,
        startDelay: parseInt(startDelay) || 0,
        notes: notes || '',
      });
    }

    let createdOrders = [];
    if (ordersToCreate.length > 0) {
      // Use insertMany for fast bulk insertion, crucial for 500+ concurrent orders
      createdOrders = await Order.insertMany(ordersToCreate);
    }

    // Populate the first one just to return complete data format for single orders
    if (createdOrders.length === 1) await Order.populate(createdOrders[0], { path: 'template', select: 'name' });
    
    res.status(201).json({ success: true, data: createdOrders.length === 1 ? createdOrders[0] : createdOrders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/orders/:id/status (pause, resume, cancel)
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['running', 'paused', 'failed', 'active'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, error: `Status must be one of: ${allowed.join(', ')}` });
    }
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/orders/:id/report
router.get('/:id/report', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('template');
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    const logs = await DeliveryLog.find({ order: order._id }).sort({ deliveredAt: 1 });

    const viewsData = logs.map(l => ({ tick: l.tick, views: l.views, deliveredAt: l.deliveredAt }));
    const likesData = logs.map(l => ({ tick: l.tick, likes: l.likes, deliveredAt: l.deliveredAt }));
    const plannedData = order.schedule.map(s => ({ tick: s.tick, plannedViews: s.views, plannedLikes: s.likes, scheduledAt: s.scheduledAt }));

    const completionRate = order.totalViews > 0
      ? ((order.deliveredViews / order.totalViews) * 100).toFixed(1)
      : '0.0';

    const duration = order.completedAt && order.startedAt
      ? Math.round((new Date(order.completedAt) - new Date(order.startedAt)) / 60000)
      : null;

    const report = {
      orderId: order._id,
      socialLink: order.socialLink,
      platform: order.platform,
      template: order.template?.name,
      status: order.status,
      generatedAt: new Date().toISOString(),
      summary: {
        totalViews: order.totalViews,
        deliveredViews: order.deliveredViews,
        totalLikes: order.totalLikes,
        deliveredLikes: order.deliveredLikes,
        completionRate: `${completionRate}%`,
        totalTicks: order.totalTicks,
        completedTicks: order.completedTicks,
        durationMinutes: duration,
        startedAt: order.startedAt,
        completedAt: order.completedAt,
      },
      plannedSchedule: plannedData,
      deliveryLog: logs,
      viewsTimeline: viewsData,
      likesTimeline: likesData,
    };

    res.json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/orders/:id
router.delete('/:id', async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    await DeliveryLog.deleteMany({ order: req.params.id });
    res.json({ success: true, message: 'Order and its logs deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
