// src/routes/stats.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const DeliveryLog = require('../models/DeliveryLog');
const Template = require('../models/Template');

// GET /api/stats
router.get('/', async (req, res) => {
  try {
    const [
      totalOrders,
      activeOrders,
      completedOrders,
      totalTemplates,
      viewsAgg,
      likesAgg,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: { $in: ['running', 'pending'] } }),
      Order.countDocuments({ status: 'completed' }),
      Template.countDocuments(),
      Order.aggregate([{ $group: { _id: null, total: { $sum: '$deliveredViews' } } }]),
      Order.aggregate([{ $group: { _id: null, total: { $sum: '$deliveredLikes' } } }]),
    ]);

    const recentOrders = await Order.find()
      .populate('template', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('socialLink platform status deliveredViews deliveredLikes totalViews totalLikes createdAt');

    res.json({
      success: true,
      data: {
        totalOrders,
        activeOrders,
        completedOrders,
        totalTemplates,
        totalViewsDelivered: viewsAgg[0]?.total || 0,
        totalLikesDelivered: likesAgg[0]?.total || 0,
        recentOrders,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
