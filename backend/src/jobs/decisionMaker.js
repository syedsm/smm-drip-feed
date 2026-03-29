// src/jobs/decisionMaker.js
const Order = require('../models/Order');

module.exports = (agenda) => {
  agenda.define('check-drip', async (job) => {
    console.log('[Agenda] Running check-drip...');
    const now = new Date();

    // Find active orders that are due for a drip
    const activeOrders = await Order.find({
      status: 'active',
      nextDripAt: { $lte: now }
    });

    console.log(`[Agenda] Found ${activeOrders.length} orders due for drip.`);

    for (const order of activeOrders) {
      // Schedule the actual delivery job
      await agenda.now('drip-delivery', { orderId: order._id });
    }
  });
};
