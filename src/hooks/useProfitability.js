import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

export const useProfitability = (pigId) => {
  // Constants (could be fetched from settings)
  const MARKET_PRICE_PER_KG = 8000; // COP example

  const stats = useLiveQuery(async () => {
    if (!pigId) return null;

    // 1. Get Pig Current Weight
    const pig = await db.pigs.get(pigId);
    if (!pig) return null;

    const currentWeight = pig.weight || 0;
    const estimatedValue = currentWeight * MARKET_PRICE_PER_KG;

    // 2. Calculate Feed Costs
    // This is complex if batch logic usage is stored. 
    // Simplified: Find all usage for this pig.
    const usages = await db.feed_usage.where('pig_id').equals(pigId).toArray();
    
    let feedCost = 0;
    for (const u of usages) {
      // We need cost_per_kg at time of usage? Or current? 
      // Ideally usage table should store cost snapshot. 
      // For now, look up current cost (Approximation)
      const feed = await db.feed_inventory.get(u.feed_id);
      if (feed) {
        feedCost += (u.amount_kg * feed.cost_per_kg);
      }
    }

    // 3. Calculate Health Costs
    const healthEvents = await db.health_events.where('pig_id').equals(pigId).toArray();
    const healthCost = healthEvents.reduce((acc, curr) => acc + (parseFloat(curr.cost) || 0), 0);

    const totalCost = feedCost + healthCost;
    const profit = estimatedValue - totalCost;
    const isProfitable = profit > 0;

    return {
      currentWeight,
      marketValue: estimatedValue, // Alias for consistent naming
      feedCost,
      healthCost,
      totalCost,
      netProfit: profit, // Alias
      roi: totalCost > 0 ? ((profit / totalCost) * 100).toFixed(1) : 0,
      isProfitable,
      isLoading: false
    };

  }, [pigId]);

  // Return default safe object while loading
  return stats || { 
      totalCost: 0, 
      netProfit: 0, 
      roi: 0, 
      marketValue: 0, 
      isLoading: true 
  };
};
