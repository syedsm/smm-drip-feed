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
      platformAgg,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: { $in: ['running', 'pending'] } }),
      Order.countDocuments({ status: 'completed' }),
      Template.countDocuments(),
      Order.aggregate([{ $group: { _id: null, total: { $sum: '$deliveredViews' } } }]),
      Order.aggregate([{ $group: { _id: null, total: { $sum: '$deliveredLikes' } } }]),
      Order.aggregate([
        {
          $group: {
            _id: { $toLower: '$platform' },
            totalOrders: { $sum: 1 },
            activeOrders: {
              $sum: {
                $cond: [
                  { $in: ['$status', ['running', 'pending', 'active']] },
                  1,
                  0
                ]
              }
            },
            deliveredViews: { $sum: '$deliveredViews' },
            deliveredLikes: { $sum: '$deliveredLikes' },
            deliveredComments: { $sum: '$deliveredComments' },
            deliveredShares: { $sum: '$deliveredShares' }
          }
        }
      ]),
    ]);

    const platformStats = {
      youtube: { totalOrders: 0, activeOrders: 0, deliveredViews: 0, deliveredLikes: 0, deliveredComments: 0, deliveredShares: 0 },
      facebook: { totalOrders: 0, activeOrders: 0, deliveredViews: 0, deliveredLikes: 0, deliveredComments: 0, deliveredShares: 0 },
      tiktok: { totalOrders: 0, activeOrders: 0, deliveredViews: 0, deliveredLikes: 0, deliveredComments: 0, deliveredShares: 0 },
      instagram: { totalOrders: 0, activeOrders: 0, deliveredViews: 0, deliveredLikes: 0, deliveredComments: 0, deliveredShares: 0 }
    };

    platformAgg.forEach(p => {
      const name = p._id;
      if (platformStats[name] !== undefined) {
        platformStats[name] = {
          totalOrders: p.totalOrders,
          activeOrders: p.activeOrders,
          deliveredViews: p.deliveredViews,
          deliveredLikes: p.deliveredLikes,
          deliveredComments: p.deliveredComments,
          deliveredShares: p.deliveredShares
        };
      }
    });

    const recentOrders = await Order.find()
      .populate('template', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('socialLink platform status deliveredViews deliveredLikes totalViews totalLikes deliveredComments totalComments deliveredShares totalShares createdAt');

    res.json({
      success: true,
      data: {
        totalOrders,
        activeOrders,
        completedOrders,
        totalTemplates,
        totalViewsDelivered: viewsAgg[0]?.total || 0,
        totalLikesDelivered: likesAgg[0]?.total || 0,
        platformStats,
        recentOrders,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
