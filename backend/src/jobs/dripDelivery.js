// src/jobs/dripDelivery.js
const Order = require('../models/Order');
const smmApi = require('../services/smmApi');
const DeliveryLog = require('../models/DeliveryLog');

module.exports = (agenda, io) => {
  agenda.define('drip-delivery', { concurrency: 5 }, async (job) => {
    const { orderId } = job.attrs.data;
    console.log(`[Agenda] Processing drip-delivery for order ${orderId}...`);

    try {
      // Populate panel to get API credentials
      const order = await Order.findById(orderId).populate('panel');
      if (!order || order.status !== 'active') {
        console.log(`[Agenda] Order ${orderId} not found or not active.`);
        return;
      }

      // Find the first undelivered slot
      const slotIndex = order.schedule.findIndex(s => !s.delivered);
      if (slotIndex === -1) {
        order.status = 'completed';
        order.completedAt = new Date();
        await order.save();
        return;
      }

      const slot = order.schedule[slotIndex];
      console.log(`[Agenda] Delivering slot ${slot.tick}: views(${slot.views}), likes(${slot.likes})`);

      // 1. Prepare delivery promises (skip if already delivered in previous attempt)
      const tasks = [];
      
      // Views Task
      if (slot.views > 0 && !slot.viewsOrderId) {
        tasks.push(
          smmApi.placeOrder(order.panel, order.socialLink, order.viewsServiceId, slot.views)
            .then(res => ({ type: 'views', ...res }))
        );
      } else {
        tasks.push(Promise.resolve({ type: 'views', skipped: true }));
      }

      // Likes Task
      if (slot.likes > 0 && !slot.likesOrderId) {
        tasks.push(
          smmApi.placeOrder(order.panel, order.socialLink, order.likesServiceId, slot.likes)
            .then(res => ({ type: 'likes', ...res }))
        );
      } else {
        tasks.push(Promise.resolve({ type: 'likes', skipped: true }));
      }

      // 2. Execute in parallel for synchronization
      const results = await Promise.all(tasks);
      const viewsRes = results.find(r => r.type === 'views');
      const likesRes = results.find(r => r.type === 'likes');

      // 3. Update slot with results
      if (!viewsRes.skipped) {
        slot.viewsOrderId = viewsRes.orderId;
        slot.viewsError = viewsRes.error;
        if (viewsRes.success) order.deliveredViews += slot.views;
      }
      
      if (!likesRes.skipped) {
        slot.likesOrderId = likesRes.orderId;
        slot.likesError = likesRes.error;
        if (likesRes.success) order.deliveredLikes += slot.likes;
      }

      // 4. Determine overall success for this attempt
      const viewsOk = slot.views === 0 || !!slot.viewsOrderId;
      const likesOk = slot.likes === 0 || !!slot.likesOrderId;
      const bothDone = viewsOk && likesOk;

      if (bothDone) {
        slot.delivered = true;
        order.delivered += 1;
        
        console.log(`[Agenda] Successfully delivered slot ${slot.tick} for order ${order._id}`);

        // Find next slot for scheduling
        const nextSlot = order.schedule.find((s, idx) => idx > slotIndex && !s.delivered);
        if (nextSlot) {
          order.nextDripAt = nextSlot.scheduledAt;
        } else {
          order.status = 'completed';
          order.completedAt = new Date();
          order.nextDripAt = null;
        }
      } else {
        // One or both failed - retry in 2 minutes
        const retryAt = new Date();
        retryAt.setMinutes(retryAt.getMinutes() + 2);
        order.nextDripAt = retryAt;
        
        const errorMsg = [viewsRes.error, likesRes.error].filter(Boolean).join(' | ');
        console.error(`[Agenda] Partial failure for order ${order._id}. Slot ${slot.tick} will retry. Error: ${errorMsg}`);
      }

      // Create delivery log entry
      await DeliveryLog.create({
        order: order._id,
        tick: slot.tick,
        views: slot.views,
        likes: slot.likes,
        viewsApiResponse: viewsRes.data || { error: viewsRes.error },
        likesApiResponse: likesRes.data || { error: likesRes.error },
        success: bothDone,
        errorMessage: [viewsRes.error, likesRes.error].filter(Boolean).join(' | ') || null,
        deliveredAt: new Date(),
      });

      await order.save();

      // Real-time progress is now handled via MongoDB Change Streams in the Web Service.
      // No more io.emit here.
    } catch (error) {
      console.error(`[Agenda] Error in drip-delivery for order ${orderId}:`, error.message);
    }
  });
};
