/**
 * Social Media Dynamic Accumulation Algorithm
 * 
 * Generates a delivery schedule based on organic cycles until a total limit is reached:
 * - Adaptive batching (scales views per cycle based on total target).
 * - Enforced 100-view minimum per cycle for panel compatibility.
 * - Randomized like delivery (likes sent on a random subset of ticks).
 * - Target-based or range-based likes distribution.
 * - Random time gaps between cycles for natural growth.
 */

/**
 * Random integer in [min, max]
 */
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate the full delivery schedule for an order based on random cycles.
 *
 * @param {Object} template - Template/Custom Rules configuration
 * @param {Date} startDate - When the campaign is created
 * @returns {{ totalViews, totalLikes, schedule: Array<DeliverySlot> }}
 */
function generateSchedule(template, startDate = new Date()) {
  const {
    minViewsPerCycle, maxViewsPerCycle, maxViewsTotal,
    minGapMins, maxGapMins,
    likesStartTick = 1,
    minLikesPerCycle = 0, maxLikesPerCycle = 0,
    totalLikes = 0
  } = template;

  // 1. Adaptive Batching: scale ranges if the total is large
  let effectiveMaxViews = maxViewsPerCycle;
  let effectiveMinViews = Math.max(minViewsPerCycle, 100); // Panel safety: min 100

  if (maxViewsTotal >= 5000) {
    effectiveMaxViews = Math.max(maxViewsPerCycle, 600);
    effectiveMinViews = Math.max(effectiveMinViews, 300);
  } else if (maxViewsTotal >= 2500) {
    effectiveMaxViews = Math.max(maxViewsPerCycle, 450);
    effectiveMinViews = Math.max(effectiveMinViews, 200);
  } else if (maxViewsTotal >= 1000) {
    effectiveMaxViews = Math.max(maxViewsPerCycle, 300);
    effectiveMinViews = Math.max(effectiveMinViews, 120);
  }

  let cumulativeTime = startDate.getTime() + (1 * 60 * 1000); // Start 1 min from now

  const schedule = [];
  let allocatedViews = 0;
  let tickCounter = 1;

  // First pass: Allocate all views and define cycle structure
  while (allocatedViews < maxViewsTotal) {
    let cycleViews = randInt(effectiveMinViews, effectiveMaxViews);
    
    if (allocatedViews + cycleViews > maxViewsTotal) {
      cycleViews = maxViewsTotal - allocatedViews;
    }

    allocatedViews += cycleViews;

    schedule.push({
      tick: tickCounter,
      scheduledAt: new Date(cumulativeTime),
      views: cycleViews,
      likes: 0,
      delivered: false,
      smmOrderId: null,
      error: null,
    });

    const gapMs = randInt(minGapMins, maxGapMins) * 60 * 1000;
    cumulativeTime += gapMs;
    tickCounter++;
  }

  // Merge final small tick if necessary to maintain > 100 views (unless only 1 tick exists)
  if (schedule.length > 1) {
    const lastSlot = schedule[schedule.length - 1];
    if (lastSlot.views < 100) {
      const secondToLast = schedule[schedule.length - 2];
      secondToLast.views += lastSlot.views;
      schedule.pop();
    }
  }

  // Second pass: Distribute likes randomly across ticks (Organic Delivery)
  const { totalHits = 0 } = template;
  let targetTotalLikes = totalLikes || 0;
  const eligibleSlots = schedule.filter(s => s.tick >= likesStartTick);
  
  if (eligibleSlots.length > 0) {
    if (totalHits > 0) {
      // 1. Total Hits Mode: Deliver likes on N random ticks
      const activeTickCount = Math.min(totalHits, eligibleSlots.length);
      const activeSlots = [...eligibleSlots]
        .sort(() => 0.5 - Math.random())
        .slice(0, activeTickCount)
        .sort((a, b) => a.tick - b.tick);

      for (const slot of activeSlots) {
        // Enforce min 10 likes per hit as requested
        const hitMin = Math.max(minLikesPerCycle, 10);
        const hitMax = Math.max(maxLikesPerCycle, hitMin);
        slot.likes = randInt(hitMin, hitMax);
      }
    } else if (targetTotalLikes > 0) {
      // 2. Legacy Target-Based Mode (Backwards compatibility)
      const maxPossibleTicks = Math.floor(targetTotalLikes / 10);
      const desiredTicks = Math.max(1, Math.floor(eligibleSlots.length * (randInt(50, 80) / 100)));
      const activeTickCount = Math.min(desiredTicks, maxPossibleTicks);
      
      const activeSlots = [...eligibleSlots]
        .sort(() => 0.5 - Math.random())
        .slice(0, activeTickCount)
        .sort((a, b) => a.tick - b.tick);

      let remainingLikes = targetTotalLikes;
      for (let i = 0; i < activeSlots.length; i++) {
        const slot = activeSlots[i];
        if (i === activeSlots.length - 1) {
          slot.likes = remainingLikes;
        } else {
          let share = Math.floor(remainingLikes / (activeSlots.length - i));
          let minForThisHit = Math.max(minLikesPerCycle, 10);
          let maxForThisHit = remainingLikes - (activeSlots.length - i - 1) * 10;
          let cycleLikes = randInt(minForThisHit, Math.min(maxForThisHit, Math.floor(share * 1.5)));
          slot.likes = cycleLikes;
          remainingLikes -= cycleLikes;
        }
      }
    } else if (maxLikesPerCycle > 0) {
      // 3. Simple Range Mode
      const activeRatio = randInt(50, 80) / 100;
      const activeTickCount = Math.max(1, Math.floor(eligibleSlots.length * activeRatio));
      const activeSlots = [...eligibleSlots]
        .sort(() => 0.5 - Math.random())
        .slice(0, activeTickCount)
        .sort((a, b) => a.tick - b.tick);

      for (const slot of activeSlots) {
        slot.likes = randInt(Math.max(minLikesPerCycle, 10), maxLikesPerCycle);
      }
    }
  }

  const finalTotalLikes = schedule.reduce((sum, s) => sum + s.likes, 0);
  return { totalViews: allocatedViews, totalLikes: finalTotalLikes, schedule };
}

module.exports = { generateSchedule, randInt };
