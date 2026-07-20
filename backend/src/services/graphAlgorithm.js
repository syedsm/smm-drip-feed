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
    totalLikes = 0,
    enableComments = false,
    minCommentsPerCycle = 0,
    maxCommentsPerCycle = 0,
    commentsStartTick = 1,
    totalComments = 0,
    enableShares = false,
    minSharesPerCycle = 0,
    maxSharesPerCycle = 0,
    sharesStartTick = 1,
    totalShares = 0,
    totalHits = 0
  } = template;

  // 1. Strict Range Settings: strictly follow user inputs with a 100-view panel floor
  let effectiveMinViews = Math.max(minViewsPerCycle, 100); // Panel safety: min 100
  let effectiveMaxViews = Math.max(maxViewsPerCycle, effectiveMinViews);

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
      comments: 0,
      shares: 0,
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
        const hitMin = Math.max(minLikesPerCycle, 0);
        const hitMax = Math.max(maxLikesPerCycle, hitMin);
        slot.likes = randInt(hitMin, hitMax);
      }
    } else if (targetTotalLikes > 0) {
      // 2. Legacy Target-Based Mode (Backwards compatibility)
      const maxPossibleTicks = Math.floor(targetTotalLikes / Math.max(minLikesPerCycle, 1));
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
          let minForThisHit = Math.max(minLikesPerCycle, 0);
          let maxForThisHit = remainingLikes - (activeSlots.length - i - 1) * Math.max(minLikesPerCycle, 0);
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
        slot.likes = randInt(Math.max(minLikesPerCycle, 0), maxLikesPerCycle);
      }
    }
  }

  // Third pass: Distribute comments (Simultaneous Delivery alongside views on random ticks)
  if (enableComments) {
    const commentsEligible = schedule.filter(s => s.tick >= commentsStartTick);
    if (commentsEligible.length > 0) {
      if (totalComments && totalComments > 0) {
        // Target-based comments distribution
        const maxPossibleTicks = Math.floor(totalComments / Math.max(minCommentsPerCycle, 1));
        const desiredTicks = Math.max(1, Math.floor(commentsEligible.length * (randInt(40, 70) / 100)));
        const activeTickCount = Math.min(desiredTicks, maxPossibleTicks);
        
        const activeSlots = [...commentsEligible]
          .sort(() => 0.5 - Math.random())
          .slice(0, activeTickCount)
          .sort((a, b) => a.tick - b.tick);

        let remainingComments = totalComments;
        for (let i = 0; i < activeSlots.length; i++) {
          const slot = activeSlots[i];
          if (i === activeSlots.length - 1) {
            slot.comments = remainingComments;
          } else {
            let share = Math.floor(remainingComments / (activeSlots.length - i));
            let minVal = Math.max(minCommentsPerCycle, 0);
            let maxVal = remainingComments - (activeSlots.length - i - 1) * minVal;
            let cycleComments = randInt(minVal, Math.min(maxVal, Math.floor(share * 1.5)));
            slot.comments = cycleComments;
            remainingComments -= cycleComments;
          }
        }
      } else if (minCommentsPerCycle > 0) {
        // Range-based comments distribution
        const commentsRatio = randInt(30, 60) / 100;
        const commentsTickCount = Math.max(1, Math.floor(commentsEligible.length * commentsRatio));
        const commentsSlots = [...commentsEligible]
          .sort(() => 0.5 - Math.random())
          .slice(0, commentsTickCount);
        for (const slot of commentsSlots) {
          slot.comments = randInt(minCommentsPerCycle, maxCommentsPerCycle);
        }
      }
    }
  }

  // Fourth pass: Distribute shares (Simultaneous Delivery alongside views on random ticks)
  if (enableShares) {
    const sharesEligible = schedule.filter(s => s.tick >= sharesStartTick);
    if (sharesEligible.length > 0) {
      if (totalShares && totalShares > 0) {
        // Target-based shares distribution
        const maxPossibleTicks = Math.floor(totalShares / Math.max(minSharesPerCycle, 1));
        const desiredTicks = Math.max(1, Math.floor(sharesEligible.length * (randInt(40, 70) / 100)));
        const activeTickCount = Math.min(desiredTicks, maxPossibleTicks);
        
        const activeSlots = [...sharesEligible]
          .sort(() => 0.5 - Math.random())
          .slice(0, activeTickCount)
          .sort((a, b) => a.tick - b.tick);

        let remainingShares = totalShares;
        for (let i = 0; i < activeSlots.length; i++) {
          const slot = activeSlots[i];
          if (i === activeSlots.length - 1) {
            slot.shares = remainingShares;
          } else {
            let share = Math.floor(remainingShares / (activeSlots.length - i));
            let minVal = Math.max(minSharesPerCycle, 0);
            let maxVal = remainingShares - (activeSlots.length - i - 1) * minVal;
            let cycleShares = randInt(minVal, Math.min(maxVal, Math.floor(share * 1.5)));
            slot.shares = cycleShares;
            remainingShares -= cycleShares;
          }
        }
      } else if (minSharesPerCycle > 0) {
        // Range-based shares distribution
        const sharesRatio = randInt(20, 50) / 100;
        const sharesTickCount = Math.max(1, Math.floor(sharesEligible.length * sharesRatio));
        const sharesSlots = [...sharesEligible]
          .sort(() => 0.5 - Math.random())
          .slice(0, sharesTickCount);
        for (const slot of sharesSlots) {
          slot.shares = randInt(minSharesPerCycle, maxSharesPerCycle);
        }
      }
    }
  }

  const finalTotalLikes = schedule.reduce((sum, s) => sum + s.likes, 0);
  const finalTotalComments = schedule.reduce((sum, s) => sum + s.comments, 0);
  const finalTotalShares = schedule.reduce((sum, s) => sum + s.shares, 0);

  return { 
    totalViews: allocatedViews, 
    totalLikes: finalTotalLikes, 
    totalComments: finalTotalComments,
    totalShares: finalTotalShares,
    schedule 
  };
}

module.exports = { generateSchedule, randInt };
